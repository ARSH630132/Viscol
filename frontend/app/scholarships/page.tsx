"use client";

import { Building2, Gift, MapPin, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { AppLayout } from "@/components/college/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cityOptions, colleges, courseOptions, formatINR, stateOptions, type College, type Course } from "@/lib/college-data";

interface ScholarshipOption {
  id: string;
  title: string;
  college: College;
}

const allScholarshipOptions: ScholarshipOption[] = colleges
  .filter((college) => college.scholarshipAvailable)
  .flatMap((college) =>
    college.scholarships.map((title, index) => ({
      id: `${college.id}-${index}`,
      title,
      college,
    })),
  );

export default function ScholarshipsPage() {
  const [search, setSearch] = useState("");
  const [course, setCourse] = useState<Course | "Any">("Any");
  const [state, setState] = useState("Any");
  const [city, setCity] = useState("Any");

  const filteredOptions = useMemo(() => {
    const query = search.trim().toLowerCase();

    return allScholarshipOptions.filter(({ college, title }) => {
      const matchesSearch = !query || college.name.toLowerCase().includes(query) || title.toLowerCase().includes(query);
      const matchesCourse = course === "Any" || college.course === course;
      const matchesState = state === "Any" || college.state === state;
      const matchesCity = city === "Any" || college.city === city;

      return matchesSearch && matchesCourse && matchesState && matchesCity;
    });
  }, [city, course, search, state]);

  const availableCities = useMemo(
    () => (state === "Any" ? cityOptions : [...new Set(colleges.filter((college) => college.state === state).map((college) => college.city))]),
    [state],
  );

  return (
    <AppLayout>
      <section className="relative overflow-hidden rounded-2xl bg-[#101f21] px-4 py-5 text-[#f7efd9] shadow-2xl shadow-black/20 sm:px-6">
        <div className="pointer-events-none absolute -left-24 top-20 h-72 w-72 rounded-full border-[40px] border-[#314244]/45" />
        <div className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-[#243436]/70" />

        <div className="relative">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#d6c091]/25 bg-[#243436]/80 px-3 py-1 text-xs font-semibold text-[#d6c091]">
                <Gift className="h-3.5 w-3.5" />
                Scholarships
              </div>
              <h1 className="mt-2 text-2xl font-bold text-[#f7efd9]">Scholarship Opportunities</h1>
              <p className="mt-1 text-sm text-[#d8cfb8]">Find colleges with scholarship support by course and location.</p>
            </div>
            <Badge className="rounded-md bg-[#d6c091] text-[#172325] hover:bg-[#d6c091]">
              {filteredOptions.length} options
            </Badge>
          </div>

          <Card className="mb-5 rounded-2xl border-[#d6c091]/25 bg-[#243436]/85 p-4 shadow-lg shadow-black/20">
            <div className="grid gap-3 md:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
              <label className="space-y-1.5">
                <span className="text-sm font-semibold text-[#f7efd9]">Search College</span>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#d6c091]" />
                  <Input
                    className="h-11 border-[#d6c091]/25 bg-white/10 pl-9 text-[#f7efd9] placeholder:text-[#d8cfb8]/70"
                    placeholder="Search by college or scholarship"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>
              </label>

              <FilterSelect
                label="Course"
                value={course}
                options={["Any", ...courseOptions]}
                onChange={(value) => setCourse(value as Course | "Any")}
              />
              <FilterSelect
                label="State"
                value={state}
                options={["Any", ...stateOptions]}
                onChange={(value) => {
                  setState(value);
                  setCity("Any");
                }}
              />
              <FilterSelect label="City" value={city} options={["Any", ...availableCities]} onChange={setCity} />
            </div>
          </Card>

          {filteredOptions.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredOptions.map((option) => (
                <ScholarshipCard key={option.id} option={option} />
              ))}
            </div>
          ) : (
            <Card className="rounded-2xl border-[#d6c091]/25 bg-[#f3e8c9] p-8 text-center text-[#172325] shadow-lg shadow-black/20">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#1d706d] text-[#f7efd9]">
                <Gift className="h-7 w-7" />
              </div>
              <h2 className="mt-4 text-2xl font-bold">No scholarship options found</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-[#536062]">Try changing the course, city, state, or search keyword.</p>
            </Card>
          )}
        </div>
      </section>
    </AppLayout>
  );
}

function ScholarshipCard({ option }: { option: ScholarshipOption }) {
  const { college, title } = option;

  return (
    <Card className="flex h-full flex-col rounded-2xl border-[#d6c091]/40 bg-[#f3e8c9] p-4 text-[#172325] shadow-lg shadow-black/20">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Badge className="rounded-md bg-[#1d706d] text-white hover:bg-[#1d706d]">Scholarship Available</Badge>
          <h2 className="mt-3 text-lg font-bold text-[#172325]">{title}</h2>
          <p className="mt-1 line-clamp-1 text-sm font-semibold text-[#172325]">{college.name}</p>
          <p className="mt-1 flex items-center gap-1 text-sm text-[#536062]">
            <MapPin className="h-4 w-4" />
            {college.city}, {college.state}
          </p>
        </div>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#e0cf9f] text-[#1d706d]">
          <Gift className="h-5 w-5" />
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <Info label="Course" value={college.course} />
        <Info label="Annual Cost" value={formatINR(college.annualCost)} />
      </div>

      <div className="mt-auto pt-4">
        <Link href={`/college/${college.slug}`}>
          <Button className="h-10 w-full rounded-lg bg-[#1d706d] text-white hover:bg-[#185d5a]">
            <Building2 className="h-4 w-4" />
            View College
          </Button>
        </Link>
      </div>
    </Card>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-[#536062]">{label}</p>
      <p className="mt-1 font-bold text-[#172325]">{value}</p>
    </div>
  );
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="space-y-1.5">
      <span className="text-sm font-semibold text-[#f7efd9]">{label}</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-11 rounded-lg border-[#d6c091]/25 bg-white/10 text-[#f7efd9] shadow-none">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}
