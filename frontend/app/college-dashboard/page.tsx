"use client";

import { BarChart3, BookOpen, Building2, Eye, Gift, ImageIcon, LayoutDashboard, MapPin, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { CollegeManagement, type AdminCollege, type CollegeEditorTab } from "@/components/admin/college-management";
import { AppLayout } from "@/components/college/layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getMe, type AuthUser } from "@/lib/auth-client";
import { managementFetch } from "@/lib/management-client";

type DashboardSection = "overview" | "basic" | "courses" | "placements" | "media" | "scholarships";

const editorTabBySection: Partial<Record<DashboardSection, CollegeEditorTab>> = {
  basic: "basic",
  courses: "courses",
  placements: "placements",
  media: "media",
  scholarships: "scholarships",
};

const sections = [
  { id: "overview", label: "Dashboard Overview", icon: LayoutDashboard },
  { id: "basic", label: "College Info & Profile", icon: Building2 },
  { id: "courses", label: "Courses & Fee Matrix", icon: BookOpen },
  { id: "placements", label: "Placement Statistics", icon: BarChart3 },
  { id: "media", label: "Images & Videos", icon: ImageIcon },
  { id: "scholarships", label: "Scholarships & Hostel", icon: Gift },
] as const;

export default function CollegeDashboardPage() {
  const [colleges, setColleges] = useState<AdminCollege[]>([]);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [selectedCollegeId, setSelectedCollegeId] = useState<number | null>(null);
  const [activeSection, setActiveSection] = useState<DashboardSection>("overview");
  const [authorized, setAuthorized] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const currentUser = await getMe();
        if (!currentUser || (currentUser.role !== "College" && currentUser.role !== "Admin")) return;
        if (cancelled) return;
        setUser(currentUser);
        setAuthorized(true);

        const result = await managementFetch<{ data: AdminCollege[] }>("/college-dashboard/colleges");
        if (cancelled) return;
        setColleges(result.data);
        setSelectedCollegeId(result.data[0]?.id ?? null);
      } catch (error) {
        if (!cancelled) toast.error(error instanceof Error ? error.message : "Unable to load college dashboard");
      } finally {
        if (!cancelled) setReady(true);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, []);

  const selectedCollege = colleges.find((college) => college.id === selectedCollegeId) ?? null;

  const saveCollegeInState = (college: AdminCollege) => {
    setColleges((current) => current.map((item) => item.id === college.id ? college : item));
  };

  const updateSection = (section: DashboardSection) => {
    setActiveSection(section);
  };

  if (!ready) {
    return <AppLayout><Card className="p-8 text-center">Loading College Dashboard...</Card></AppLayout>;
  }
  if (!authorized) {
    return <AppLayout><Card className="p-8 text-center">College access is required.</Card></AppLayout>;
  }
  if (!selectedCollege) {
    return <AppLayout><Card className="mx-auto max-w-2xl p-8 text-center">No college has been assigned to this account. Please contact the platform administrator.</Card></AppLayout>;
  }

  const placements = selectedCollege.courses.flatMap((course) => course.placements ?? []);
  const averagePackage = placements.length
    ? placements.reduce((total, placement) => total + placement.average_package, 0) / placements.length
    : 0;
  const highestPackage = placements.reduce((highest, placement) => Math.max(highest, placement.highest_package), 0);
  const totalSeats = selectedCollege.courses.reduce((total, course) => total + course.seats, 0);

  return (
    <AppLayout>
      <div className="space-y-6">
        <Card className="premium-card flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="flex min-w-0 items-center gap-4">
            {selectedCollege.logo_url ? (
              <Image src={selectedCollege.logo_url} alt="" width={64} height={64} unoptimized className="h-16 w-16 rounded-xl object-cover" />
            ) : (
              <span className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-primary text-xl font-bold text-primary-foreground">
                {selectedCollege.name.slice(0, 2).toUpperCase()}
              </span>
            )}
            <div className="min-w-0">
              {colleges.length > 1 ? (
                <label className="mb-1 block text-xs font-medium text-muted-foreground" htmlFor="college-selector">Managed college</label>
              ) : null}
              {colleges.length > 1 ? (
                <select
                  id="college-selector"
                  value={selectedCollege.id}
                  onChange={(event) => {
                    setSelectedCollegeId(Number(event.target.value));
                    setActiveSection("overview");
                  }}
                  className="mb-1 max-w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                >
                  {colleges.map((college) => <option key={college.id} value={college.id}>{college.name}</option>)}
                </select>
              ) : null}
              <h1 className="truncate text-xl font-bold sm:text-2xl">{selectedCollege.name}</h1>
              <p className="mt-1 inline-flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0" /> {selectedCollege.city}, {selectedCollege.state}
              </p>
            </div>
          </div>
          <Button asChild variant="outline">
            <Link href={`/college/${selectedCollege.slug}`}><Eye className="mr-2 h-4 w-4" /> View Public Page</Link>
          </Button>
        </Card>

        <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="flex min-w-0 flex-col rounded-2xl border border-border bg-card lg:sticky lg:top-20 lg:h-fit">
            <div className="flex items-center gap-3 border-b border-border p-5">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
                <ShieldCheck className="h-6 w-6" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">College Portal</p>
                <p className="truncate font-semibold">{user?.name ?? "College Representative"}</p>
              </div>
            </div>
            <nav aria-label="College dashboard sections" className="flex gap-2 overflow-x-auto p-3 lg:flex-col">
              {sections.map(({ id, label, icon: Icon }) => {
                const isActive = activeSection === id;
                return (
                  <button
                    key={id}
                    type="button"
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => updateSection(id)}
                    className={`flex min-h-12 shrink-0 items-center gap-3 rounded-xl px-3 text-left text-sm font-medium transition-colors lg:w-full ${
                      isActive ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span className="truncate">{label}</span>
                    {id === "courses" ? <span className="ml-auto rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">{selectedCollege.courses.length}</span> : null}
                  </button>
                );
              })}
            </nav>
            <div className="mt-auto hidden border-t border-border p-4 lg:block">
              <div className="flex items-center gap-3 rounded-xl border border-border bg-background/50 p-3">
                <BarChart3 className="h-5 w-5 text-primary" />
                <p className="text-xs text-muted-foreground">Edits update your college’s public profile.</p>
              </div>
            </div>
          </aside>

          <section className="min-w-0 space-y-5">
            {activeSection === "overview" ? (
              <>
                <header>
                  <p className="inline-flex items-center gap-2 text-sm text-primary"><LayoutDashboard className="h-4 w-4" /> College administration</p>
                  <h2 className="mt-1 text-3xl font-bold">Dashboard Overview</h2>
                </header>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <MetricCard label="Listed Courses" value={`${selectedCollege.courses.length} Programs`} detail={`Seats offered: ${totalSeats}`} />
                  <MetricCard label="Average Package" value={`${averagePackage.toFixed(1)} LPA`} detail={placements.length ? `Highest: ${highestPackage} LPA` : "Add placement details to show statistics"} />
                  <MetricCard label="College Profile" value={selectedCollege.isVisible ? "Visible" : "Hidden"} detail={selectedCollege.isVisible ? "Shown on the public website" : "Contact an administrator to change visibility"} />
                </div>
                <Card className="premium-card flex flex-wrap items-center justify-between gap-4 p-5">
                  <div>
                    <h3 className="font-semibold">Manage your public college information</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Update profile details, courses, fees, placements, images, videos, scholarships, and hostel information.</p>
                  </div>
                  <Button onClick={() => updateSection("basic")}>Edit College Profile</Button>
                </Card>
              </>
            ) : null}

            <div className={activeSection === "overview" ? "hidden" : ""}>
              <CollegeManagement
                key={selectedCollege.id}
                mode="college"
                colleges={[selectedCollege]}
                activeTab={editorTabBySection[activeSection]}
                onActiveTabChange={(tab) => {
                  const matchingSection = sections.find((section) => editorTabBySection[section.id] === tab);
                  if (matchingSection) setActiveSection(matchingSection.id);
                }}
                onCollegeSaved={saveCollegeInState}
              />
            </div>
          </section>
        </div>
      </div>
    </AppLayout>
  );
}

function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <Card className="premium-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
    </Card>
  );
}
