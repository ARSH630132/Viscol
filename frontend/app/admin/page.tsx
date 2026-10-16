"use client";

import { Building2, Eye, LayoutDashboard, ShieldCheck, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { CollegeManagement, type AdminCollege } from "@/components/admin/college-management";
import { AppLayout } from "@/components/college/layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getMe } from "@/lib/auth-client";
import { managementFetch } from "@/lib/management-client";

type Role = "Student" | "College" | "Admin";
type User = { id: number; name: string; email: string; mobile: string; role: Role; assigned_colleges: Array<{ id: number; name: string }> };
type CollegeOption = Pick<AdminCollege, "id" | "name" | "city" | "state">;
type AdminSection = "overview" | "users" | "colleges";

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [colleges, setColleges] = useState<AdminCollege[]>([]);
  const [allowed, setAllowed] = useState(false);
  const [activeSection, setActiveSection] = useState<AdminSection>("overview");
  const [admin, setAdmin] = useState<{ name: string; email: string } | null>(null);

  const load = async () => {
    try {
      const [userResult, collegeResult] = await Promise.all([managementFetch<{ data: User[] }>("/admin/users"), managementFetch<{ data: AdminCollege[] }>("/admin/colleges")]);
      setUsers(userResult.data);
      setColleges(collegeResult.data);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to load administration data"); }
  };

  useEffect(() => { getMe().then((user) => { if (user?.role === "Admin") { setAdmin(user); setAllowed(true); load(); } }); }, []);
  if (!allowed) return <AppLayout><Card className="p-8 text-center">Admin access is required.</Card></AppLayout>;

  const saveUser = async (user: User, role: Role, collegeIds: number[]) => {
    await managementFetch(`/admin/users/${user.id}`, { method: "PATCH", body: JSON.stringify({ role, collegeIds }) });
    toast.success("User access updated");
    load();
  };
  const saveCollegeInState = (college: AdminCollege) => {
    setColleges((current) => {
      const exists = current.some((item) => item.id === college.id);
      return exists
        ? current.map((item) => item.id === college.id ? college : item)
        : [...current, college].sort((first, second) => first.name.localeCompare(second.name));
    });
  };

  const hiddenCollegeCount = colleges.filter((college) => !college.isVisible).length;
  const sections = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "users", label: "Registered Users", icon: Users, count: users.length },
    { id: "colleges", label: "Colleges", icon: Building2, count: colleges.length },
  ] as const;

  return (
    <AppLayout>
      <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="flex min-w-0 flex-col rounded-2xl border border-border bg-card lg:sticky lg:top-20 lg:min-h-[calc(100vh-7rem)]">
          <div className="flex items-center gap-3 border-b border-border p-5">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
              <ShieldCheck className="h-6 w-6" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">Platform Admin</p>
              <p className="font-semibold">Admin Portal</p>
            </div>
          </div>

          <nav aria-label="Admin sections" className="flex gap-2 overflow-x-auto p-3 lg:flex-col">
            {sections.map(({ id, label, icon: Icon, ...item }) => {
              const isActive = activeSection === id;
              return (
                <button
                  key={id}
                  type="button"
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => setActiveSection(id)}
                  className={`flex min-h-12 shrink-0 items-center gap-3 rounded-xl px-3 text-left text-sm font-medium transition-colors lg:w-full ${
                    isActive
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="truncate">{label}</span>
                  {"count" in item ? (
                    <span className="ml-auto flex shrink-0 items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                      {item.count}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto hidden border-t border-border p-4 lg:block">
            <div className="flex min-w-0 items-center gap-3 rounded-xl border border-border bg-background/50 p-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-primary/30 bg-primary/10 font-semibold text-primary">
                {admin?.name.slice(0, 1).toUpperCase() ?? "A"}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{admin?.name ?? "Administrator"}</p>
                <p className="truncate text-xs text-muted-foreground">{admin?.email ?? "Admin account"}</p>
              </div>
            </div>
          </div>
        </aside>

        <section className="min-w-0 space-y-5">
          <header>
            <p className="inline-flex items-center gap-2 text-sm text-primary">
              <ShieldCheck className="h-4 w-4" /> Platform administration
            </p>
            <h1 className="mt-1 text-3xl font-bold">
              {activeSection === "overview" ? "Admin Dashboard" : sections.find((section) => section.id === activeSection)?.label}
            </h1>
          </header>

          {activeSection === "overview" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <button type="button" onClick={() => setActiveSection("users")} className="text-left">
                <Card className="premium-card flex h-full items-center gap-4 p-5 transition-colors hover:border-primary/50">
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Users className="h-6 w-6" />
                  </span>
                  <span>
                    <span className="block text-2xl font-bold">{users.length}</span>
                    <span className="text-sm text-muted-foreground">Registered Users</span>
                  </span>
                </Card>
              </button>
              <button type="button" onClick={() => setActiveSection("colleges")} className="text-left">
                <Card className="premium-card flex h-full items-center gap-4 p-5 transition-colors hover:border-primary/50">
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Eye className="h-6 w-6" />
                  </span>
                  <span>
                    <span className="block text-2xl font-bold">{hiddenCollegeCount}</span>
                    <span className="text-sm text-muted-foreground">Hidden Colleges</span>
                  </span>
                </Card>
              </button>
              <button type="button" onClick={() => setActiveSection("colleges")} className="text-left">
                <Card className="premium-card flex h-full items-center gap-4 p-5 transition-colors hover:border-primary/50">
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Building2 className="h-6 w-6" />
                  </span>
                  <span>
                    <span className="block text-2xl font-bold">{colleges.length}</span>
                    <span className="text-sm text-muted-foreground">Colleges</span>
                  </span>
                </Card>
              </button>
            </div>
          ) : null}

          {activeSection === "users" ? (
            <Card className="premium-card overflow-x-auto p-0">
              <div className="border-b border-border p-5">
                <h2 className="flex items-center gap-2 text-xl font-semibold"><Users className="h-5 w-5" /> Registered Users</h2>
              </div>
              <table className="w-full min-w-[850px] text-sm">
                <thead className="bg-muted/40 text-left">
                  <tr>
                    <th className="p-4">Name</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Mobile</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Assigned colleges</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>{users.map((user) => <UserRow key={user.id} user={user} colleges={colleges} onSave={saveUser} />)}</tbody>
              </table>
            </Card>
          ) : null}

          {activeSection === "colleges" ? (
            <CollegeManagement colleges={colleges} onCollegeSaved={saveCollegeInState} />
          ) : null}
        </section>
      </div>
    </AppLayout>
  );
}

function UserRow({ user, colleges, onSave }: { user: User; colleges: CollegeOption[]; onSave: (user: User, role: Role, collegeIds: number[]) => Promise<void> }) {
  const [role, setRole] = useState<Role>(user.role);
  const [ids, setIds] = useState(user.assigned_colleges.map((college) => college.id));
  const toggleCollege = (collegeId: number, checked: boolean) => {
    setIds((current) => checked
      ? [...new Set([...current, collegeId])]
      : current.filter((id) => id !== collegeId));
  };

  return (
    <tr className="border-t border-border">
      <td className="p-4 font-medium">{user.name}</td>
      <td className="p-4">{user.email}</td>
      <td className="p-4">{user.mobile}</td>
      <td className="p-4">
        <select value={role} onChange={(event) => setRole(event.target.value as Role)} className="rounded border border-input bg-background px-2 py-1">
          <option>Student</option><option>College</option><option>Admin</option>
        </select>
      </td>
      <td className="p-4">
        <div className="max-h-32 min-w-56 space-y-1 overflow-y-auto rounded-md border border-input p-2">
          {colleges.length ? colleges.map((college) => (
            <label key={college.id} className="flex cursor-pointer items-start gap-2 rounded px-1 py-1 text-xs hover:bg-accent">
              <input
                type="checkbox"
                checked={ids.includes(college.id)}
                onChange={(event) => toggleCollege(college.id, event.target.checked)}
                disabled={role !== "College"}
                className="mt-0.5"
              />
              <span>
                <span className="block font-medium">{college.name}</span>
                <span className="text-muted-foreground">ID {college.id} · {college.city}, {college.state}</span>
              </span>
            </label>
          )) : <p className="text-xs text-muted-foreground">Add a college first.</p>}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{role === "College" ? `${ids.length} college${ids.length === 1 ? "" : "s"} selected` : "Only used for College role"}</p>
      </td>
      <td className="p-4"><Button size="sm" onClick={() => onSave(user, role, role === "College" ? ids : [])}>Save</Button></td>
    </tr>
  );
}
