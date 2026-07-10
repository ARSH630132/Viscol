"use client";

import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Building2,
  FileText,
  Gift,
  GraduationCap,
  Headphones,
  Heart,
  IndianRupee,
  Landmark,
  MapPin,
  Menu,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
// import { AUTH_STATE_EVENT, getMe, isLoggedIn, logout, type AuthUser } from "@/lib/auth-client"; Login is not required for this project, so auth client is not needed
import {
  collegeTypeOptions,
  colleges,
  courseOptions,
  formatLPA,
  placementPreferences,
  stateOptions,
  type College,
} from "@/lib/college-data";
import {
  COLLEGE_STATE_EVENT,
  compareState,
  defaultSearchFilters,
  searchState,
  type SearchFilters,
  wishlistState,
} from "@/lib/college-state";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Colleges", href: "/colleges" },
  { label: "Compare", href: "/compare" },
  { label: "Guides", href: "/guides" },
  { label: "Scholarships", href: "/scholarships" },
  { label: "About Us", href: "/about-us" },
];

const featureItems = [
  { icon: IndianRupee, title: "Budget Colleges", description: "Find colleges within your affordability" },
  { icon: BarChart3, title: "Compare Colleges", description: "Side-by-data comparison of key factors" },
  { icon: ArrowRight, title: "Placement Analytics", description: "Detailed placement state and top recruiters" },
  { icon: FileText, title: "Fee Breakdown", description: "Complete fee structure transparency" },
  { icon: Gift, title: "Scholarship Info", description: "Find scholarships you are eligible for" },
  { icon: Headphones, title: "Admission Support", description: "Expert guidance for admissions" },
];

const collegeLabels = ["Best Value", "Top Placement", "Most Affordable", "Top Private"];

const howItWorks = [
  {
    icon: GraduationCap,
    title: "Select Course",
    description: "Choose your preferred course and specialization",
  },
  {
    icon: SlidersHorizontal,
    title: "Set Preference",
    description: "Set your budget, location and other preferences",
  },
  {
    icon: Landmark,
    title: "Compare Colleges",
    description: "Compare colleges side-by-side on key factors",
  },
  {
    icon: Headphones,
    title: "Get Support",
    description: "Get admission guidance and expert support",
  },
];

const footerSections = [
  {
    title: "Explore",
    links: [
      { label: "Colleges", href: "/colleges" },
      { label: "Compare", href: "/compare" },
      { label: "Scholarships", href: "/scholarships" },
      { label: "Guides", href: "/guides" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Apply Through Us", href: "/apply" },
      { label: "About Us", href: "/about-us" },
      // { label: "Login", href: "/register" },Login is not required for this project, so login is not needed
    ],
  },
];

export default function Index() {
  const router = useRouter();
  const [filters, setFilters] = useState<SearchFilters>(defaultSearchFilters);
  const [compareCount, setCompareCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  // const [user, setUser] = useState<AuthUser | null>(null);Login is not required for this project, so user state is not needed
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const sync = () => {
      setFilters(searchState.get());
      setCompareCount(compareState.get().length);
      setWishlistCount(wishlistState.get().length);
    };

    sync();
    window.addEventListener(COLLEGE_STATE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(COLLEGE_STATE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  /* Login is not required for this project, so auth state sync is not needed
  useEffect(() => {
    const sync = () => {
      getMe()
        .then(setUser)
        .catch(() => setUser(null));
    };

    sync();
    window.addEventListener(AUTH_STATE_EVENT, sync);
    return () => window.removeEventListener(AUTH_STATE_EVENT, sync);
  }, []);
  */

  const topColleges = useMemo(() => colleges.slice(0, 4), []);

  const updateFilter = <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const submitSearch = async () => {
    searchState.set(filters);
    /*Login is not required for this project, so login check is not needed
    if (!(await isLoggedIn())) {
      router.push("/register?redirect=/colleges");
      return;
    }
    */
    router.push("/colleges");
  };

  return (
    <div className="min-h-screen bg-[#f4eddd] text-[#172325]">
      <header className="sticky top-0 z-50 bg-[#121c20] text-[#f7efd9] shadow-lg shadow-black/20">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-[#d6c091]">
            <GraduationCap className="h-6 w-6" />
            College Visitor
          </Link>

          <nav className="hidden items-center gap-2 lg:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  item.href === "/" ? "bg-[#1d706d] text-white" : "text-[#f7efd9] hover:bg-white/10"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <Link href="/compare" className="flex h-9 items-center gap-2 rounded-md border border-white/15 px-3 text-sm">
              <BarChart3 className="h-4 w-4" />
              {compareCount}
            </Link>
            <Link href="/wishlist" className="flex h-9 items-center gap-2 rounded-md border border-white/15 px-3 text-sm">
              <Heart className="h-4 w-4" />
              {wishlistCount}
            </Link>
            {/*Login is not required for this project, so login/logout buttons are not needed
            {user ? (
              <div className="flex items-center gap-2 rounded-md border border-white/15 px-3 py-1.5 text-sm">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-[#1d706d] text-xs font-bold text-white">
                  {user.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="max-w-36 truncate">{user.name} · {user.mobile}</span>
                <button type="button" className="text-xs text-[#d6c091] hover:text-white" onClick={() => logout()}>
                  Logout
                </button>
              </div>
            ) : (
              <Link href="/register">
                <Button variant="outline" size="sm" className="border-white/20 bg-transparent text-[#f7efd9] hover:bg-white/10 hover:text-white">
                  Login
                </Button>
              </Link>
            )}
            */}
            <Link href="/apply">
              <Button size="sm" className="bg-[#1d706d] text-white hover:bg-[#185d5a]">
                Apply Through Us
              </Button>
            </Link>
          </div>

          <button
            type="button"
            className="grid h-9 w-9 place-items-center rounded-md border border-white/15 lg:hidden"
            aria-label="Toggle menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {menuOpen ? (
          <div className="fixed inset-x-0 bottom-0 z-[60] border-t border-white/10 bg-[#121c20] px-4 pb-6 pt-4 shadow-2xl shadow-black/40 lg:hidden">
            <div className="mb-2 flex justify-end">
              <button
                type="button"
                className="grid h-9 w-9 place-items-center rounded-md border border-white/15 text-[#f7efd9] hover:bg-white/10"
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="grid gap-1">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className="rounded-md px-3 py-2 text-sm hover:bg-white/10">
                  {item.label}
                </Link>
              ))}
              <Link href="/apply" onClick={() => setMenuOpen(false)} className="pt-2">
                <Button className="w-full bg-[#1d706d] text-white hover:bg-[#185d5a]">Apply Through Us</Button>
              </Link>
              {/*Login is not required for this project, so login/logout buttons are not needed
              {user ? (
                <button
                  type="button"
                  className="mt-2 flex items-center justify-between rounded-md border border-white/15 px-3 py-2 text-sm"
                  onClick={() => {
                    logout();
                    setMenuOpen(false);
                  }}
                >
                  <span className="truncate">{user.name} · {user.mobile}</span>
                  <span className="text-[#d6c091]">Logout</span>
                </button>
              ) : (
                <Link href="/register" onClick={() => setMenuOpen(false)} className="pt-2">
                  <Button variant="outline" className="w-full border-white/20 bg-transparent text-[#f7efd9] hover:bg-white/10 hover:text-white">
                    Login
                  </Button>
                </Link>
              )}
              */}
            </nav>
          </div>
        ) : null}
      </header>

      <main>
        <section className="relative overflow-hidden bg-[#eee5cf]">
          <div
            className="absolute inset-y-0 right-0 hidden w-[56%] bg-[#172326] lg:block"
            style={{ clipPath: "polygon(18% 0, 100% 0, 100% 100%, 0 100%)" }}
          />
          <div className="absolute -left-28 bottom-[-145px] h-[390px] w-[390px] rounded-full bg-[#d8c79e]/50" />

<div className="absolute -left-5 bottom-0 h-[300px] w-[220px] rotate-[-24deg] rounded-[55%] border-[34px] border-[#c7b48a]/70" />
          <div className="absolute -left-12 top-[-110px] h-[260px] w-[390px] rounded-[50%] bg-[#e0d0aa]" />
          <div className="absolute left-[31%] top-[-170px] hidden h-[340px] w-[520px] rounded-full bg-[#d8c79e]/70 lg:block" />
          <div className="absolute bottom-[-82px] right-[-58px] h-40 w-72 rounded-tl-full bg-[#e0d0aa]" />
          <div className="absolute left-4 top-4 h-40 w-32 opacity-40 [background-image:radial-gradient(#b7ab8b_1.5px,transparent_1.5px)] [background-size:14px_14px]" />
          <div className="absolute inset-y-0 left-[48%] hidden w-28 bg-gradient-to-r from-transparent via-[#efe6cf]/70 to-transparent blur-xl lg:block" />

          <div className="relative mx-auto grid max-w-7xl gap-7 px-4 py-6 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:py-5">
            <div className="space-y-6">
              <Badge className="gap-2 rounded-full border-[#d6c091]/40 bg-[#f4eddd]/90 px-4 py-2 text-sm text-[#172325] shadow-none hover:bg-[#f4eddd]/90">
                <ShieldCheck className="h-4 w-4 text-[#1d706d]" />
                India&apos;s Most Trusted College Discovery Platform
              </Badge>

              <div className="space-y-3">
  <h1 className="max-w-2xl text-[2.35rem] font-extrabold leading-[1.08] tracking-[-0.04em] text-[#121c20] sm:text-5xl lg:text-[3.25rem] xl:text-[3.55rem]">
  Find Your{" "}
  <span className="text-[#1d706d]">
    Dream College
  </span>
  <br />
  <span className="text-[#121c20]">
    Within Your Family Budget
  </span>
</h1>
  <p className="max-w-lg text-sm leading-6 text-[#172325] sm:text-base">
    Discover colleges based on affordability, placements, scholarships and career outcomes.
  </p>
</div>

              <div className="grid max-w-2xl grid-cols-2 gap-4 sm:grid-cols-4">
                <HeroStat icon={Building2} value="1500+" label="Colleges" />
                <HeroStat icon={Users} value="50,000+" label="Students Helped" />
                <HeroStat icon={GraduationCap} value="20Cr+" label="Scholarships" />
                <HeroStat icon={Star} value="AI" label="Powered" />
              </div>
            </div>

            <Card className="rounded-2xl border border-white/15 bg-[#2a3639]/90 p-4 text-[#f8f1df] shadow-2xl shadow-black/40 backdrop-blur sm:p-5 lg:ml-4">
              <div className="grid gap-3 md:grid-cols-2">
                <SearchSelect
                  icon={BookOpen}
                  label="Course"
                  value={filters.course}
                  onValueChange={(value) => updateFilter("course", value as SearchFilters["course"])}
                  options={courseOptions}
                />
                <SearchSelect
                  icon={MapPin}
                  label="State (Optional)"
                  value={filters.state}
                  onValueChange={(value) => updateFilter("state", value)}
                  options={["Any", ...stateOptions]}
                />
                <SearchSelect
  icon={Building2}
  label="City (Optional)"
  value={filters.city}
  onValueChange={(value) => updateFilter("city", value)}
  options={[
    "Any",
    ...Array.from(
      new Set(
        colleges
          .filter((college) => !filters.state || college.state === filters.state)
          .map((college) => college.city)
      )
    ),
  ]}
/>
                <SearchSelect
                  icon={BarChart3}
                  label="Placement Preference"
                  value={filters.placementPreference}
                  onValueChange={(value) => updateFilter("placementPreference", value as SearchFilters["placementPreference"])}
                  options={placementPreferences}
                />
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-[1fr_150px] md:items-end">
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-[#f8f1df]">Budget Range (Annual)</p>
                  <div className="flex items-center gap-3 text-xs text-[#f8f1df]/80">
                    <span>50K</span>
                    <Slider
                      value={[filters.budget]}
                      min={50000}
                      max={2000000}
                      step={25000}
                      onValueChange={(value) => updateFilter("budget", value[0])}
                    />
                    <span>20L</span>
                  </div>
                </div>
                <div className="rounded-lg bg-[#f4eddd]/15 px-4 py-3">
                  <p className="text-xs text-[#f8f1df]/70">Selected Budget</p>
                  <p className="text-xl font-bold text-[#f8f1df]">{formatHomeINR(filters.budget)}</p>
                </div>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto]">
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-[#f8f1df]">College Type</p>
                  <div className="flex flex-wrap gap-2">
                    {collegeTypeOptions.map((type) => {
                      const checked = filters.collegeTypes.includes(type);
                      return (
                        <button
                          key={type}
                          type="button"
                          className={`rounded-full border px-3 py-2 text-xs font-medium transition-colors ${
                            checked ? "border-[#e0cf9f] bg-[#e0cf9f] text-[#172325]" : "border-white/20 bg-white/5 text-[#f8f1df]"
                          }`}
                          onClick={() => {
                            updateFilter(
                              "collegeTypes",
                              checked
                                ? filters.collegeTypes.filter((item) => item !== type)
                                : [...filters.collegeTypes, type],
                            );
                          }}
                        >
                          {type}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-[#f8f1df]">Scholarship</p>
                  <button
                    type="button"
                    className={`rounded-full border px-4 py-2 text-xs font-medium transition-colors ${
                      filters.scholarshipOnly ? "border-[#e0cf9f] bg-[#e0cf9f] text-[#172325]" : "border-white/20 bg-white/5 text-[#f8f1df]"
                    }`}
                    onClick={() => updateFilter("scholarshipOnly", !filters.scholarshipOnly)}
                  >
                    Scholarship Available
                  </button>
                </div>
              </div>

              <Button className="mt-4 h-12 w-full gap-2 rounded-lg bg-[#121c20] text-[#f8f1df] hover:bg-[#0b1316]" onClick={submitSearch}>
                <Search className="h-5 w-5" />
                Find My College
              </Button>
            </Card>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-5 px-4 py-5 sm:px-6 md:grid-cols-2 xl:grid-cols-6">
          {featureItems.map((feature) => (
            <div key={feature.title} className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-[#1d706d]">
                <feature.icon className="h-6 w-6" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-[#172325]">{feature.title}</h3>
                <p className="mt-1 text-xs leading-5 text-[#324447]">{feature.description}</p>
              </div>
            </div>
          ))}
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-5 sm:px-6">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-md border border-[#d8cdaa] text-[#1d706d]">
                <Star className="h-4 w-4" />
              </span>
              <h2 className="text-2xl font-bold text-[#172325]">Top Colleges</h2>
            </div>
            <Link href="/colleges" className="hidden items-center gap-1 text-sm font-semibold text-[#1d706d] sm:inline-flex">
              View all colleges <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {topColleges.map((college, index) => (
              <div key={college.id} className="group relative">
                <HomeCollegeRibbon college={college} />
              <Card className="overflow-hidden rounded-xl border-[#d8cdaa] bg-[#fbf6ea] shadow-md shadow-[#b8a67a]/20 transition-all duration-300 group-hover:-translate-y-2 group-hover:border-[#d6c091] group-hover:shadow-[0_18px_35px_rgba(214,192,145,0.35)]">
                <div className="relative">
                  <img src={college.image} alt={`${college.name} campus`} className="h-32 w-full object-cover" loading="lazy" width={1280} height={832} />
                  <span className="absolute left-3 top-3 rounded-md bg-[#1d706d] px-2 py-1 text-[10px] font-bold uppercase text-white transition-opacity duration-200 group-hover:opacity-0">
                    {collegeLabels[index]}
                  </span>
                  <span className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-[#f4eddd] text-[#1d706d] shadow">
                    <Heart className="h-4 w-4" />
                  </span>
                  <span className="absolute bottom-0 right-0 rounded-tl-md bg-[#1d706d] px-2 py-1 text-xs font-bold text-white">#{index + 1}</span>
                </div>
                <div className="p-3">
                  <h3 className="line-clamp-1 text-base font-bold text-[#172325]">{college.name}</h3>
                  <p className="mt-1 flex items-center gap-1 text-xs text-[#536062]">
                    <MapPin className="h-3.5 w-3.5" />
                    {college.city}, {college.state}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-sm font-medium text-[#172325]">
                    <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                    {college.rating} <span className="text-xs font-normal text-[#536062]">({800 + index * 60} reviews)</span>
                  </p>

                  <div className="mt-3 grid grid-cols-3 divide-x divide-[#d8cdaa] text-center">
                    <CollegeMetric value={formatHomeINR(college.annualCost)} label="Annual Fee" />
                    <CollegeMetric value={formatLPA(college.averagePackageLpa)} label="Avg. Package" />
                    <CollegeMetric value={`${college.placementRate}%`} label="Placement" />
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <label className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[#d8cdaa] text-xs font-medium text-[#172325]">
                      <Checkbox className="h-4 w-4" />
                      Compare
                    </label>
                    <Link href={`/college/${college.slug}`}>
                      <Button className="h-9 w-full gap-1 rounded-md bg-[#1d706d] text-xs text-white hover:bg-[#185d5a]">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
          <div className="mb-4 flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-md border border-[#d8cdaa] text-[#1d706d]">
              <Headphones className="h-4 w-4" />
            </span>
            <h2 className="text-2xl font-bold text-[#172325]">How It Works</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {howItWorks.map((step, index) => (
              <Card key={step.title} className="rounded-xl border-[#d8cdaa] bg-[#fbf6ea] p-4 shadow-sm">
                <div className="flex items-center gap-4">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#1d706d] text-sm font-bold text-white">
                    {index + 1}
                  </span>
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#efe4c8] text-[#1d706d]">
                    <step.icon className="h-6 w-6" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-[#172325]">{step.title}</h3>
                    <p className="mt-1 text-xs leading-5 text-[#536062]">{step.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-[#d6c091]/15 bg-[#101f21] text-[#f7efd9]">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1.3fr_1fr_1fr]">
          <div className="col-span-2 lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2 text-lg font-semibold text-[#d6c091]">
              <GraduationCap className="h-6 w-6" />
              College Visitor
            </Link>
            <p className="mt-3 max-w-md text-sm leading-6 text-[#d8cfb8]">
              Helping students discover budget-friendly colleges with transparent fees, placements,
              scholarships, and admission support.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {["Budget First", "Verified Guidance", "Free Support"].map((item) => (
                <span key={item} className="rounded-md border border-[#d6c091]/20 bg-white/5 px-3 py-1 text-xs text-[#d6c091]">
                  {item}
                </span>
              ))}
            </div>
          </div>

          {footerSections.map((section) => (
            <div key={section.title}>
              <h2 className="text-sm font-semibold text-[#d6c091]">{section.title}</h2>
              <nav className="mt-3 grid gap-2">
                {section.links.map((link) => (
                  <Link key={link.href} href={link.href} className="text-sm text-[#d8cfb8] transition-colors hover:text-white">
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          ))}
        </div>

        <div className="border-t border-[#d6c091]/10">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 text-xs text-[#d8cfb8] sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p>Copyright 2026 College Visitor. All rights reserved.</p>
            <p>Built for students, parents, and admission guidance teams.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function HeroStat({ icon: Icon, value, label }: { icon: LucideIcon; value: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#f4eddd] text-[#1d706d] shadow">
        <Icon className="h-6 w-6" />
      </span>
      <div>
        <p className="text-lg font-bold text-[#172325]">{value}</p>
        <p className="text-xs text-[#172325]">{label}</p>
      </div>
    </div>
  );
}

function SearchSelect({
  icon: Icon,
  label,
  value,
  onValueChange,
  options,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: string[];
}) {
  const current = value || "Any";

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-[#f8f1df]">{label}</p>
      <Select value={current} onValueChange={(next) => onValueChange(next === "Any" ? "" : next)}>
        <SelectTrigger className="h-11 rounded-md border-white/20 bg-white/10 text-[#f8f1df] shadow-none">
          <div className="flex min-w-0 items-center gap-3">
            <Icon className="h-4 w-4 shrink-0 text-[#e0cf9f]" />
            <SelectValue placeholder="Select" />
          </div>
        </SelectTrigger>
        <SelectContent>
          {options.map((item) => (
            <SelectItem key={item} value={item}>
              {item}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function CollegeMetric({ value, label }: { value: string; label: string }) {
  return (
    <div className="px-2">
      <p className="truncate text-xs font-bold text-[#172325]">{value}</p>
      <p className="mt-1 text-[11px] text-[#536062]">{label}</p>
    </div>
  );
}

function HomeCollegeRibbon({ college }: { college: College }) {
  const badgeText = getCollegeBadge(college);
  const badgeFontSize = badgeText.length > 18 ? 31 : badgeText.length > 13 ? 35 : 40;
  const badgeLetterSpacing = badgeText.length > 18 ? 1.5 : badgeText.length > 13 ? 2 : 3;

  return (
    <div className="pointer-events-none absolute left-1/2 top-0 z-30 h-[78px] w-[390px] -translate-x-1/2 -translate-y-[30px] opacity-0 transition-all duration-300 group-hover:-translate-y-[42px] group-hover:opacity-100">
      <svg className="h-full w-full drop-shadow-[0_18px_18px_rgba(0,0,0,0.34)]" viewBox="0 0 900 210" role="img" aria-label={badgeText}>
        <defs>
          <linearGradient id={`home-college-badge-teal-${college.id}`} x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#0e7475" />
            <stop offset="52%" stopColor="#075e63" />
            <stop offset="100%" stopColor="#043e43" />
          </linearGradient>
          <linearGradient id={`home-college-badge-gold-${college.id}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#fff0b7" />
            <stop offset="42%" stopColor="#d7b966" />
            <stop offset="100%" stopColor="#8d6b22" />
          </linearGradient>
          <linearGradient id={`home-college-badge-shadow-${college.id}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#063b40" />
            <stop offset="100%" stopColor="#021f23" />
          </linearGradient>
          <pattern id={`home-college-badge-texture-${college.id}`} width="8" height="8" patternUnits="userSpaceOnUse">
            <path d="M0 8 L8 0" stroke="#ffffff" strokeOpacity="0.05" strokeWidth="1" />
          </pattern>
          <filter id={`home-college-badge-text-shadow-${college.id}`} x="-20%" y="-30%" width="140%" height="160%">
            <feDropShadow dx="0" dy="4" floodColor="#031f21" floodOpacity="0.75" stdDeviation="1.4" />
          </filter>
          <path id={`home-college-badge-arc-${college.id}`} d="M178 108 C320 68 580 68 722 108" />
        </defs>

        <path d="M28 93 L238 56 L282 142 L80 178 L112 125 Z" fill={`url(#home-college-badge-teal-${college.id})`} stroke={`url(#home-college-badge-gold-${college.id})`} strokeWidth="7" />
        <path d="M872 93 L662 56 L618 142 L820 178 L788 125 Z" fill={`url(#home-college-badge-teal-${college.id})`} stroke={`url(#home-college-badge-gold-${college.id})`} strokeWidth="7" />
        <path d="M214 132 C225 164 254 174 295 147 L265 93 C252 115 234 128 214 132 Z" fill={`url(#home-college-badge-shadow-${college.id})`} stroke={`url(#home-college-badge-gold-${college.id})`} strokeWidth="5" />
        <path d="M686 132 C675 164 646 174 605 147 L635 93 C648 115 666 128 686 132 Z" fill={`url(#home-college-badge-shadow-${college.id})`} stroke={`url(#home-college-badge-gold-${college.id})`} strokeWidth="5" />
        <path d="M177 60 C300 20 600 20 723 60 L695 149 C548 121 352 121 205 149 Z" fill={`url(#home-college-badge-teal-${college.id})`} stroke={`url(#home-college-badge-gold-${college.id})`} strokeLinejoin="round" strokeWidth="8" />
        <path d="M177 60 C300 20 600 20 723 60" fill="none" stroke="#fff0b7" strokeOpacity="0.78" strokeWidth="3" />
        <path d="M205 149 C352 121 548 121 695 149" fill="none" stroke="#f0d486" strokeOpacity="0.9" strokeWidth="6" />
        <path d="M202 75 C322 43 578 43 698 75 L679 128 C538 108 362 108 221 128 Z" fill={`url(#home-college-badge-texture-${college.id})`} opacity="0.85" />
        <path d="M222 134 C360 112 540 112 678 134" fill="none" stroke="#f9e6a6" strokeOpacity="0.58" strokeWidth="2" />
        <text fill="#e7cc80" filter={`url(#home-college-badge-text-shadow-${college.id})`} fontFamily="Arial, Helvetica, sans-serif" fontSize={badgeFontSize} fontWeight="900" letterSpacing={badgeLetterSpacing}>
          <textPath href={`#home-college-badge-arc-${college.id}`} startOffset="50%" textAnchor="middle">
            {badgeText}
          </textPath>
        </text>
      </svg>
    </div>
  );
}

function getCollegeBadge(college: College): string {
  if (college.highestPackageLpa >= 35) {
    return "HIGHEST PLACEMENT";
  }

  if (college.averagePackageLpa >= 6) {
    return "TOP PLACEMENT CHOICE";
  }

  if (college.annualCost <= 150000) {
    return "LOWER FEES";
  }

  if (college.rating >= 4.4) {
    return "BEST COLLEGE";
  }

  if (college.scholarshipAvailable) {
    return "SCHOLARSHIP AVAILABLE";
  }

  return "POPULAR CHOICE";
}

function formatHomeINR(value: number) {
  if (value >= 10000000) return `\u20b9${(value / 10000000).toFixed(1)}Cr`;
  if (value >= 100000) return `\u20b9${(value / 100000).toFixed(1)}L`;
  return `\u20b9${value.toLocaleString("en-IN")}`;
}
