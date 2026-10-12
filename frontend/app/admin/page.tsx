"use client";

import { ShieldCheck, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppLayout } from "@/components/college/layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { getMe } from "@/lib/auth-client";
import { managementFetch } from "@/lib/management-client";

type Role = "Student" | "College" | "Admin";
type College = { id: number; name: string; isVisible: boolean; city: string; state: string };
type User = { id: number; name: string; email: string; mobile: string; role: Role; assigned_colleges: Array<{ id: number; name: string }> };

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [allowed, setAllowed] = useState(false);

  const load = async () => {
    try {
      const [userResult, collegeResult] = await Promise.all([managementFetch<{ data: User[] }>("/admin/users"), managementFetch<{ data: College[] }>("/admin/colleges")]);
      setUsers(userResult.data);
      setColleges(collegeResult.data);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to load administration data"); }
  };

  useEffect(() => { getMe().then((user) => { if (user?.role === "Admin") { setAllowed(true); load(); } }); }, []);
  if (!allowed) return <AppLayout><Card className="p-8 text-center">Admin access is required.</Card></AppLayout>;

  const saveUser = async (user: User, role: Role, collegeIds: number[]) => {
    await managementFetch(`/admin/users/${user.id}`, { method: "PATCH", body: JSON.stringify({ role, collegeIds }) });
    toast.success("User access updated");
    load();
  };
  const toggleVisibility = async (college: College, isVisible: boolean) => {
    const result = await managementFetch<{ data: { id: number; isVisible: boolean } }>(`/admin/colleges/${college.id}/visibility`, { method: "PATCH", body: JSON.stringify({ isVisible }) });
    setColleges((current) => current.map((item) => item.id === result.data.id ? { ...item, isVisible: result.data.isVisible } : item));
    toast.success(`${college.name} is now ${result.data.isVisible ? "visible" : "hidden"}`);
  };

  return <AppLayout><div className="space-y-6">
    <div><p className="inline-flex items-center gap-2 text-primary"><ShieldCheck className="h-5 w-5" /> Platform administration</p><h1 className="mt-1 text-3xl font-bold">Admin Dashboard</h1></div>
    <Card className="premium-card overflow-x-auto p-0"><div className="border-b border-border p-5"><h2 className="flex items-center gap-2 text-xl font-semibold"><Users className="h-5 w-5" /> Registered Users</h2></div>
      <table className="w-full min-w-[850px] text-sm"><thead className="bg-muted/40 text-left"><tr><th className="p-4">Name</th><th className="p-4">Email</th><th className="p-4">Mobile</th><th className="p-4">Role</th><th className="p-4">Assigned colleges</th><th className="p-4">Actions</th></tr></thead><tbody>
        {users.map((user) => <UserRow key={user.id} user={user} onSave={saveUser} />)}
      </tbody></table>
    </Card>
    <Card className="premium-card overflow-x-auto p-0"><div className="border-b border-border p-5"><h2 className="text-xl font-semibold">College Visibility</h2><p className="mt-1 text-sm text-muted-foreground">Hidden colleges remain available to administrators but are removed from public results.</p></div>
      <div className="divide-y divide-border">{colleges.map((college) => <div key={college.id} className="flex items-center justify-between gap-4 p-4"><div><p className="font-medium">{college.name}</p><p className="text-sm text-muted-foreground">{college.city}, {college.state}</p></div><label className="flex items-center gap-3 text-sm font-medium"><span className={college.isVisible ? "text-primary" : "text-muted-foreground"}>{college.isVisible ? "Visible" : "Hidden"}</span><Switch checked={college.isVisible} onCheckedChange={(isVisible) => toggleVisibility(college, isVisible)} aria-label={`${college.isVisible ? "Hide" : "Show"} ${college.name}`} /></label></div>)}</div>
    </Card>
  </div></AppLayout>;
}

function UserRow({ user, onSave }: { user: User; onSave: (user: User, role: Role, collegeIds: number[]) => Promise<void> }) {
  const [role, setRole] = useState<Role>(user.role);
  const [ids, setIds] = useState(user.assigned_colleges.map((college) => college.id));
  return <tr className="border-t border-border"><td className="p-4 font-medium">{user.name}</td><td className="p-4">{user.email}</td><td className="p-4">{user.mobile}</td><td className="p-4"><select value={role} onChange={(event) => setRole(event.target.value as Role)} className="rounded border border-input bg-background px-2 py-1"><option>Student</option><option>College</option><option>Admin</option></select></td><td className="p-4"><Input value={ids.join(", ")} onChange={(event) => setIds(event.target.value.split(",").map(Number).filter(Number.isInteger))} disabled={role !== "College"} placeholder="College IDs, e.g. 1, 2" className="h-8 w-36" /><p className="mt-1 text-xs text-muted-foreground">{user.assigned_colleges.map((college) => college.name).join(", ") || "—"}</p></td><td className="p-4"><Button size="sm" onClick={() => onSave(user, role, ids)}>Save</Button></td></tr>;
}
