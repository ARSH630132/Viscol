"use client";

import { Bookmark, Building2, MapPin, SlidersHorizontal, Star } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { CompareTray } from "@/components/college/compare-tray";
import { AppLayout } from "@/components/college/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  collegeTypeOptions,
  courseOptions,
  formatINR,
  formatLPA,
  placementPreferences,
  stateOptions,
  type College,
} from "@/lib/college-data";
import { filterColleges, sortColleges, sortOptions, type SortOption } from "@/lib/college-filters";
import { compareState, defaultSearchFilters, searchState, wishlistState, type SearchFilters } from "@/lib/college-state";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function CollegesPage() {
  const [filters, setFilters] = useState<SearchFilters>(defaultSearchFilters);
  const [sortBy, setSortBy] = useState<SortOption>("recommended");
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const [wishIds, setWishIds] = useState<number[]>([]);
  const [apiColleges, setApiColleges] = useState<College[]>([]);

  useEffect(() => {
    setFilters(searchState.get());
    setCompareIds(compareState.get());
    setWishIds(wishlistState.get());
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`${API_BASE_URL}/api/colleges?limit=50`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Unable to fetch colleges");
        }
        return response.json();
      })
      .then((payload) => {
        setApiColleges((payload.data || []).map(mapApiCollegeToUiCollege));
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          toast.error("Unable to load colleges");
        }
      });

    return () => controller.abort();
  }, []);

  const filtered = useMemo(() => sortColleges(filterColleges(apiColleges, filters), sortBy), [apiColleges, filters, sortBy]);

  const updateFilter = <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const onApplyFilters = () => {
    searchState.set(filters);
    toast.success("Filters applied");
  };

  const onToggleCompare = (id: number, checked: boolean) => {
    const next = checked ? [...new Set([...compareIds, id])] : compareIds.filter((item) => item !== id);
    if (next.length > 3) {
      toast.error("You can compare up to 3 colleges.");
      return;
    }
    setCompareIds(next);
    compareState.set(next);
  };

  const onToggleWishlist = (id: number) => {
    const exists = wishIds.includes(id);
    const next = exists ? wishIds.filter((item) => item !== id) : [...wishIds, id];
    setWishIds(next);
    wishlistState.set(next);
  };

  return (
    <AppLayout>
      <div className="relative min-h-[calc(100vh-7rem)] w-full overflow-visible bg-[#101f21] px-4 py-6 text-[#f7efd9] sm:px-6 md:h-[calc(100vh-8rem)] md:min-h-0 md:overflow-hidden lg:px-8">
        <div className="pointer-events-none absolute -left-28 top-28 h-[360px] w-[360px] rounded-full border-[46px] border-[#314244]/45" />
        <div className="pointer-events-none absolute -right-28 bottom-[-120px] h-[360px] w-[360px] rounded-full border-[46px] border-[#314244]/45" />
        <div className="pointer-events-none absolute left-5 top-8 h-52 w-40 opacity-30 [background-image:radial-gradient(#d6c091_1.5px,transparent_1.5px)] [background-size:14px_14px]" />

        <div className="relative mx-auto flex h-full min-h-0 w-full max-w-[1600px] flex-col overflow-hidden px-2 sm:px-4">
          <div className="mb-4 shrink-0 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between lg:pl-1">
            <div className="flex items-baseline gap-2 whitespace-nowrap sm:block">
              <h1 className="text-2xl font-semibold text-[#f7efd9]">Colleges |</h1>
              <p className="text-sm text-[#d8cfb8]">Showing {filtered.length} colleges</p>
            </div>

            <div className="inline-flex w-full items-center gap-2 rounded-lg border border-[#d6c091]/25 bg-[#213033]/80 p-2 text-sm sm:w-auto">
              <SlidersHorizontal className="h-4 w-4 text-[#d6c091]" />
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                <SelectTrigger className="h-8 flex-1 border-none bg-transparent text-[#f7efd9] shadow-none sm:w-52 sm:flex-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid flex-1 min-h-0 overflow-hidden gap-5 lg:grid-cols-[270px_1fr] xl:grid-cols-[300px_1fr]">
            <aside className="h-full overflow-hidden rounded-2xl border border-[#d6c091]/20 bg-[#243436]/80 p-4 shadow-2xl shadow-black/20 backdrop-blur">
              <div className="h-full min-h-0 overflow-y-auto overflow-x-hidden pr-2">
  <div className="space-y-4 pb-6">
                <FilterSelect
                  label="Course"
                  value={filters.course}
                  onChange={(value) => updateFilter("course", value as SearchFilters["course"])}
                  options={courseOptions}
                />

                <FilterSelect
                  label="State"
                  value={filters.state}
                  onChange={(value) => {
                    updateFilter("state", value);
                    updateFilter("city", "");
                  }}
                  options={["Any", ...stateOptions]}
                />

                <FilterSelect
                  label="City"
                  value={filters.city}
                  onChange={(value) => updateFilter("city", value)}
                  options={[
                    "Any",
                    ...Array.from(
                      new Set(
                        apiColleges
                          .filter((college) => !filters.state || college.state === filters.state)
                          .map((college) => college.city),
                      ),
                    ),
                  ]}
                />

                <FilterSelect
                  label="Placement Filter"
                  value={filters.placementPreference}
                  onChange={(value) => updateFilter("placementPreference", value as SearchFilters["placementPreference"])}
                  options={placementPreferences}
                />

                <div className="space-y-2">
                  <p className="text-sm font-semibold text-[#f7efd9]">Budget Range (Annual)</p>
                  <div className="flex items-center justify-between text-xs text-[#d8cfb8]">
                    <span>Γé╣50K</span>
                    <span>Γé╣20L</span>
                  </div>
                  <Slider
                    value={[filters.budget]}
                    min={50000}
                    max={2000000}
                    step={25000}
                    onValueChange={(value) => updateFilter("budget", value[0])}
                  />
                  <Badge className="rounded-md bg-[#d6c091] text-[#172325] hover:bg-[#d6c091]">
                    Selected: Γé╣{filters.budget.toLocaleString("en-IN")}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold text-[#f7efd9]">College Type</p>
                  <div className="grid grid-cols-2 gap-2">
                    {collegeTypeOptions.map((type) => (
                      <label
                        key={type}
                        className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition-colors ${
                          filters.collegeTypes.includes(type)
                            ? "border-[#d6c091] bg-[#1d706d] text-white"
                            : "border-[#d6c091]/30 bg-[#f7efd9] text-[#172325]"
                        }`}
                      >
                        <Checkbox
                          className="hidden"
                          checked={filters.collegeTypes.includes(type)}
                          onCheckedChange={(checked) => {
                            const enabled = checked === true;
                            updateFilter(
                              "collegeTypes",
                              enabled
                                ? [...filters.collegeTypes, type]
                                : filters.collegeTypes.filter((item) => item !== type),
                            );
                          }}
                        />
                        {type}
                      </label>
                    ))}
                  </div>
                </div>

                <label className="inline-flex items-center gap-2 text-sm font-medium text-[#f7efd9]">
                  <Checkbox
                    checked={filters.scholarshipOnly}
                    onCheckedChange={(value) => updateFilter("scholarshipOnly", value === true)}
                  />
                  Scholarship Available
                </label>

                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                  <Button className="w-full rounded-xl bg-[#1d706d] text-white hover:bg-[#185d5a]" onClick={onApplyFilters}>
                    Apply Filters
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full rounded-xl border-[#d6c091]/40 bg-transparent text-[#f7efd9] hover:bg-[#f7efd9] hover:text-[#172325]"
                    onClick={() => {
                      setFilters(defaultSearchFilters);
                      searchState.set(defaultSearchFilters);
                    }}
                  >
                    Clear All
                  </Button>
                </div>
              </div>
              </div>
            </aside>

            <div className="h-full min-h-0 space-y-4 overflow-y-auto overflow-x-hidden pr-2">
              {filtered.map((college) => (
                <CollegeListCard
                  key={college.id}
                  college={college}
                  compared={compareIds.includes(college.id)}
                  wished={wishIds.includes(college.id)}
                  onToggleCompare={onToggleCompare}
                  onToggleWishlist={onToggleWishlist}
                />
              ))}

              {filtered.length === 0 ? (
                <div className="rounded-xl border border-[#d6c091]/20 bg-[#243436]/80 p-6 text-center text-[#d8cfb8]">
                  No colleges found for current filters. Try adjusting budget, location, or placement preferences.
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <CompareTray count={compareIds.length} />
      </div>
    </AppLayout>
  );
}

function mapApiCollegeToUiCollege(college: ApiCollege): College {
  const firstCourse = college.courses?.[0];
  const firstFee = college.fees?.[0] || firstCourse?.fees?.[0];
  const firstPlacement = college.placements?.[0] || firstCourse?.placements?.[0];
  const gallery = college.gallery_images?.length ? college.gallery_images : [college.cover_image_url || "/images/campus-1.jpg"];
  const annualCost = firstFee?.total_annual_cost || 0;
  const averagePackageLpa = firstPlacement?.average_package || 0;
  const highestPackageLpa = firstPlacement?.highest_package || 0;

  return {
    id: college.id,
    slug: college.slug,
    name: college.name,
    logoText: college.name
      .split(" ")
      .filter((word) => word.length > 2)
      .slice(0, 3)
      .map((word) => word[0])
      .join("")
      .toUpperCase(),
    state: college.state,
    city: college.city,
    course: (firstCourse?.course_name || "B.Tech") as College["course"],
    collegeType: college.college_type as College["collegeType"],
    description: college.description,
    image: college.cover_image_url || gallery[0],
    gallery,
    rating: college.rating,
    fees: {
      tuition: firstFee?.tuition_fee_yearly || 0,
      hostel: firstFee?.hostel_fee_yearly || 0,
      mess: firstFee?.mess_fee_yearly || 0,
      exam: firstFee?.exam_fee_yearly || 0,
      transport: firstFee?.transport_fee_yearly || 0,
    },
    annualCost,
    courseCost: firstFee?.total_course_cost || annualCost * (firstCourse?.duration_years || 4),
    averagePackageLpa,
    highestPackageLpa,
    placementRate: firstPlacement?.placement_percentage || 0,
    scholarshipAvailable: college.scholarships?.some((item) => item.scholarship_available) || false,
    scholarships: college.scholarships?.map((item) => item.title) || [],
    accreditation: college.accreditations || [],
    approvals: college.approvals || [],
    affiliation: college.affiliation,
    campusAreaAcres: 0,
    establishedYear: college.established_year,
    recruiters: firstPlacement?.top_recruiters || [],
    hostelFacilities: college.hostel?.facilities || [],
    budgetScore: annualCost < 120000 ? 5 : annualCost < 180000 ? 4 : annualCost < 260000 ? 3 : 2,
    reviews:
      college.reviews?.map((review) => ({
        student: review.student_name,
        academics: review.academics_rating,
        placements: review.placement_rating,
        hostel: review.hostel_rating,
        faculty: review.academics_rating,
        campusLife: review.campus_rating,
        comment: review.review_text,
      })) || [],
  };
}

interface ApiCollege {
  id: number;
  name: string;
  slug: string;
  description: string;
  college_type: string;
  state: string;
  city: string;
  established_year: number;
  affiliation: string;
  approvals: string[];
  accreditations: string[];
  rating: number;
  cover_image_url: string | null;
  gallery_images: string[];
  courses?: Array<{
    course_name: string;
    duration_years: number;
    fees?: ApiFee[];
    placements?: ApiPlacement[];
  }>;
  fees?: ApiFee[];
  placements?: ApiPlacement[];
  scholarships?: Array<{
    title: string;
    scholarship_available: boolean;
  }>;
  hostel?: {
    facilities: string[];
  } | null;
  reviews?: Array<{
    student_name: string;
    academics_rating: number;
    placement_rating: number;
    hostel_rating: number;
    campus_rating: number;
    review_text: string;
  }>;
}

interface ApiFee {
  tuition_fee_yearly: number;
  hostel_fee_yearly: number;
  mess_fee_yearly: number;
  exam_fee_yearly: number;
  transport_fee_yearly: number;
  total_annual_cost: number;
  total_course_cost: number;
}

interface ApiPlacement {
  average_package: number;
  highest_package: number;
  placement_percentage: number;
  top_recruiters: string[];
}

function CollegeListCard({
  college,
  compared,
  wished,
  onToggleCompare,
  onToggleWishlist,
}: {
  college: College;
  compared: boolean;
  wished: boolean;
  onToggleCompare: (id: number, checked: boolean) => void;
  onToggleWishlist: (id: number) => void;
}) {
  const badgeText = getCollegeBadge(college);
  const badgeFontSize = badgeText.length > 18 ? 31 : badgeText.length > 13 ? 35 : 40;
  const badgeLetterSpacing = badgeText.length > 18 ? 1.5 : badgeText.length > 13 ? 2 : 3;

  return (
<article className="group relative mt-4 overflow-visible rounded-2xl border-[3px] border-[#d6c091] bg-[#f3e8c9] p-2 text-[#172325] shadow-lg shadow-black/25 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_18px_35px_rgba(214,192,145,0.35)] sm:mt-16 sm:p-4">
<div className="pointer-events-none absolute left-1/2 top-0 z-30 h-[104px] w-[520px] -translate-x-1/2 -translate-y-[42px] opacity-0 transition-all duration-300 group-hover:-translate-y-[54px] group-hover:opacity-100">
  <svg className="h-full w-full drop-shadow-[0_18px_18px_rgba(0,0,0,0.34)]" viewBox="0 0 900 210" role="img" aria-label={badgeText}>
    <defs>
      <linearGradient id={`college-badge-teal-${college.id}`} x1="0" x2="1" y1="0" y2="1">
        <stop offset="0%" stopColor="#0e7475" />
        <stop offset="52%" stopColor="#075e63" />
        <stop offset="100%" stopColor="#043e43" />
      </linearGradient>
      <linearGradient id={`college-badge-gold-${college.id}`} x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stopColor="#fff0b7" />
        <stop offset="42%" stopColor="#d7b966" />
        <stop offset="100%" stopColor="#8d6b22" />
      </linearGradient>
      <linearGradient id={`college-badge-shadow-${college.id}`} x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stopColor="#063b40" />
        <stop offset="100%" stopColor="#021f23" />
      </linearGradient>
      <pattern id={`college-badge-texture-${college.id}`} width="8" height="8" patternUnits="userSpaceOnUse">
        <path d="M0 8 L8 0" stroke="#ffffff" strokeOpacity="0.05" strokeWidth="1" />
      </pattern>
      <filter id={`college-badge-text-shadow-${college.id}`} x="-20%" y="-30%" width="140%" height="160%">
        <feDropShadow dx="0" dy="4" floodColor="#031f21" floodOpacity="0.75" stdDeviation="1.4" />
      </filter>
      <path id={`college-badge-arc-${college.id}`} d="M178 108 C320 68 580 68 722 108" />
    </defs>

    <path d="M28 93 L238 56 L282 142 L80 178 L112 125 Z" fill={`url(#college-badge-teal-${college.id})`} stroke={`url(#college-badge-gold-${college.id})`} strokeWidth="7" />
    <path d="M872 93 L662 56 L618 142 L820 178 L788 125 Z" fill={`url(#college-badge-teal-${college.id})`} stroke={`url(#college-badge-gold-${college.id})`} strokeWidth="7" />
    <path d="M214 132 C225 164 254 174 295 147 L265 93 C252 115 234 128 214 132 Z" fill={`url(#college-badge-shadow-${college.id})`} stroke={`url(#college-badge-gold-${college.id})`} strokeWidth="5" />
    <path d="M686 132 C675 164 646 174 605 147 L635 93 C648 115 666 128 686 132 Z" fill={`url(#college-badge-shadow-${college.id})`} stroke={`url(#college-badge-gold-${college.id})`} strokeWidth="5" />

    <path d="M177 60 C300 20 600 20 723 60 L695 149 C548 121 352 121 205 149 Z" fill={`url(#college-badge-teal-${college.id})`} stroke={`url(#college-badge-gold-${college.id})`} strokeLinejoin="round" strokeWidth="8" />
    <path d="M177 60 C300 20 600 20 723 60" fill="none" stroke="#fff0b7" strokeOpacity="0.78" strokeWidth="3" />
    <path d="M205 149 C352 121 548 121 695 149" fill="none" stroke="#f0d486" strokeOpacity="0.9" strokeWidth="6" />
    <path d="M202 75 C322 43 578 43 698 75 L679 128 C538 108 362 108 221 128 Z" fill={`url(#college-badge-texture-${college.id})`} opacity="0.85" />
    <path d="M222 134 C360 112 540 112 678 134" fill="none" stroke="#f9e6a6" strokeOpacity="0.58" strokeWidth="2" />

    <text fill="#e7cc80" filter={`url(#college-badge-text-shadow-${college.id})`} fontFamily="Arial, Helvetica, sans-serif" fontSize={badgeFontSize} fontWeight="900" letterSpacing={badgeLetterSpacing}>
      <textPath href={`#college-badge-arc-${college.id}`} startOffset="50%" textAnchor="middle">
        {badgeText}
      </textPath>
    </text>
  </svg>
</div>
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
        <div className="absolute -right-12 -top-20 h-44 w-44 rounded-full bg-[#e2d3aa]" />
        <div className="absolute -bottom-20 left-3 h-32 w-44 rounded-full bg-[#e2d3aa]/60" />
        <div className="absolute bottom-0 left-0 h-24 w-40 opacity-20 [background-image:radial-gradient(#85764e_1px,transparent_1px)] [background-size:10px_10px]" />
      </div>

      <div className="relative grid gap-2 sm:gap-4 md:grid-cols-[260px_1fr]">
        <img
          src={college.image}
          alt={`${college.name} campus`}
          className="h-24 w-full rounded-xl object-cover sm:h-44 md:h-40"
          loading="lazy"
          width={1280}
          height={832}
        />

        <div className="min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-2 sm:gap-3">
            <div className="min-w-0">
              <h2 className="line-clamp-1 text-base font-bold text-[#172325] sm:text-xl">{college.name}</h2>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-[#536062] sm:mt-1 sm:text-sm">
                <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                {college.city}, {college.state} ΓÇó {college.collegeType}
              </p>
            </div>
            <div className="inline-flex items-center gap-1 rounded-lg bg-[#e0cf9f] px-2 py-0.5 text-xs font-bold text-[#172325] sm:px-3 sm:py-1 sm:text-sm">
              <Star className="h-3.5 w-3.5 fill-[#1d706d] text-[#1d706d] sm:h-4 sm:w-4" />
              {college.rating}/5
            </div>
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5 sm:mt-3 sm:gap-2">
            <Badge className="rounded-md bg-[#efe4c8] px-2 py-0.5 text-[10px] text-[#172325] hover:bg-[#efe4c8] sm:px-3 sm:py-1 sm:text-xs">{college.course}</Badge>
            {college.scholarshipAvailable ? (
              <Badge className="rounded-md bg-[#1d706d] px-2 py-0.5 text-[10px] text-white hover:bg-[#1d706d] sm:px-3 sm:py-1 sm:text-xs">Scholarship Available</Badge>
            ) : null}
            {college.accreditation.slice(0, 2).map((item) => (
              <Badge key={item} className="rounded-md bg-[#efe4c8] px-2 py-0.5 text-[10px] text-[#172325] hover:bg-[#efe4c8] sm:px-3 sm:py-1 sm:text-xs">
                {item}
              </Badge>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2 text-xs sm:mt-4 sm:gap-3 sm:text-sm lg:grid-cols-4">
            <ResultMetric label="Annual Cost" value={formatINR(college.annualCost)} />
            <ResultMetric label="Average Package" value={formatLPA(college.averagePackageLpa)} />
            <ResultMetric label="Highest Package" value={formatLPA(college.highestPackageLpa)} />
            <ResultMetric label="Placement Rate" value={`${college.placementRate}%`} />
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 sm:mt-4 sm:gap-3">
            <label className="inline-flex items-center gap-2 text-xs text-[#536062] sm:text-sm">
              <Checkbox checked={compared} onCheckedChange={(value) => onToggleCompare(college.id, value === true)} />
              Compare
            </label>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className={`grid h-8 w-8 place-items-center rounded-lg border border-[#1d706d]/30 sm:h-10 sm:w-10 ${
                  wished ? "bg-[#1d706d] text-white" : "bg-[#1d706d] text-[#f7efd9]"
                }`}
                onClick={() => onToggleWishlist(college.id)}
                aria-label="Save college"
              >
                <Bookmark className={`h-4 w-4 ${wished ? "fill-current" : ""}`} />
              </button>
              <Link href={`/college/${college.slug}`}>
                <Button className="h-8 gap-1 rounded-lg bg-[#b69858] px-3 text-xs text-[#172325] hover:bg-[#a98848] sm:h-10 sm:gap-2 sm:px-4 sm:text-sm">
                  <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  View Details
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </article>
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

function ResultMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-[#536062] sm:text-xs">{label}</p>
      <p className="mt-0.5 text-xs font-bold text-[#172325] sm:mt-1 sm:text-sm">{value}</p>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  const current = value || "Any";
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-semibold text-[#f7efd9]">{label}</p>
      <Select value={current} onValueChange={(next) => onChange(next === "Any" ? "" : next)}>
        <SelectTrigger className="h-11 rounded-lg border-[#d6c091]/25 bg-white/10 text-[#f7efd9] shadow-none">
          <SelectValue />
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
