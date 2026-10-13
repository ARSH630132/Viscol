"use client";

import { Building2, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppLayout } from "@/components/college/layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getMe } from "@/lib/auth-client";
import { managementFetch } from "@/lib/management-client";

type ManagedCollege = { id: number; name: string; website?: string | null; city: string; state: string; description: string; isVisible: boolean };

export default function CollegeDashboardPage() {
  const [colleges, setColleges] = useState<ManagedCollege[]>([]);
  const [allowed, setAllowed] = useState(false);
  const load = () => managementFetch<{ data: ManagedCollege[] }>("/college-dashboard/colleges").then((result) => setColleges(result.data)).catch((error) => toast.error(error.message));
  useEffect(() => { getMe().then((user) => { if (user?.role === "College" || user?.role === "Admin") { setAllowed(true); load(); } }); }, []);
  if (!allowed) return <AppLayout><Card className="p-8 text-center">College access is required.</Card></AppLayout>;
  return <AppLayout><div className="space-y-6"><div><p className="inline-flex items-center gap-2 text-primary"><Building2 className="h-5 w-5" /> Assigned institutions</p><h1 className="mt-1 text-3xl font-bold">College Dashboard</h1></div>{colleges.map((college) => <CollegeEditor key={college.id} college={college} />)}</div></AppLayout>;
}

function CollegeEditor({ college }: { college: ManagedCollege }) {
  const [form, setForm] = useState(college);
  const save = async () => { await managementFetch(`/college-dashboard/colleges/${college.id}`, { method: "PATCH", body: JSON.stringify({ name: form.name, website: form.website, city: form.city, state: form.state, description: form.description }) }); toast.success("College details saved"); };
  return <Card className="premium-card p-5"><div className="grid gap-4 md:grid-cols-2"><label>Name<Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label>Website<Input value={form.website || ""} onChange={(event) => setForm({ ...form, website: event.target.value })} /></label><label>City<Input value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} /></label><label>State<Input value={form.state} onChange={(event) => setForm({ ...form, state: event.target.value })} /></label></div><label className="mt-4 block">Description<Textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="mt-1" /></label><Button className="mt-4" onClick={save}><Save className="mr-2 h-4 w-4" /> Save changes</Button></Card>;
}
