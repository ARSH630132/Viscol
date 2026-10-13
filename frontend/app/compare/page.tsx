"use client";

import { Check, MapPin, Star, Trophy, X } from "lucide-react";
import { useEffect, useState } from "react";

import { AppLayout } from "@/components/college/layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatINR, formatLPA, type College } from "@/lib/college-data";
import { compareState } from "@/lib/college-state";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function ComparePage() {
  const [compareIds, setCompareIds] = useState<number[]>(() => compareState.get());
  const [compared, setCompared] = useState<College[]>([]);

  useEffect(() => {
    if (compareIds.length === 0) {
      return;
    }

    const controller = new AbortController();

    fetch(`${API_BASE_URL}/api/compare?ids=${compareIds.slice(0, 3).join(",")}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Unable to fetch compared colleges");
        }
        return response.json();
      })
      .then((payload) => {
        setCompared((payload.data || []).map(mapApiCollegeToUiCollege));
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          setCompared([]);
        }
      });

    return () => controller.abort();
  }, [compareIds]);

  const totals = compared.map((college) => ({
    id: college.id,
    total: college.fees.tuition + college.fees.hostel + college.fees.mess,
    placement: college.averagePackageLpa,
    overall: college.rating + college.averagePackageLpa / 3,
  }));

  const bestBudgetId = totals.length ? totals.reduce((prev, curr) => (curr.total < prev.total ? curr : prev)).id : -1;
  const bestPlacementId = totals.length
    ? totals.reduce((prev, curr) => (curr.placement > prev.placement ? curr : prev)).id
    : -1;
  const bestOverallId = totals.length ? totals.reduce((prev, curr) => (curr.overall > prev.overall ? curr : prev)).id : -1;

  const winner = compared.find((college) => college.id === bestOverallId);
  const columnWidth = `${100 / (compared.length + 1)}%`;

  if (compared.length === 0) {
    return (
      <AppLayout>
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <h1 className="text-2xl font-semibold">Compare Colleges</h1>
          <p className="mt-2 text-muted-foreground">Select up to 3 colleges from listings to view comparison.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Compare Colleges</h1>
        <Button variant="outline" onClick={() => { compareState.set([]); setCompareIds([]); setCompared([]); }}>
          Clear Compare
        </Button>
      </div>

      <Card className="overflow-x-auto rounded-2xl border-[#26384b] bg-[#0d1729] p-0 text-[#d7e0ee] shadow-2xl shadow-black/20">
        <table className="w-full table-fixed border-collapse text-sm">
          <thead>
            <tr className="border-b border-[#1d2a3c] text-left">
              <th style={{ width: columnWidth }} className="min-w-64 bg-[#101a2e] px-6 py-7 align-top">
                <p className="text-sm font-bold uppercase tracking-wide text-[#b2c0d6]">Comparison criteria</p>
                <p className="mt-2 text-sm font-normal text-[#72829b]">Scroll to view detailed breakdowns</p>
                <span className="mt-7 inline-flex items-center gap-1 rounded-md border border-emerald-400/25 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-300">
                  <Star className="h-4 w-4" /> Auto-highlights best value
                </span>
              </th>
              {compared.map((college) => (
                <th key={college.id} style={{ width: columnWidth }} className="border-l border-[#1d2a3c] p-5 align-top">
                  <div className="relative rounded-2xl border border-[#22314a] bg-[#050b1a] p-3">
                    <button
                      type="button"
                      aria-label={`Remove ${college.name} from comparison`}
                      className="absolute right-5 top-5 z-10 grid h-8 w-8 place-items-center rounded-full bg-[#344158] text-[#d7e0ee] hover:bg-[#44536c]"
                      onClick={() => {
                        const next = compareIds.filter((id) => id !== college.id);
                        compareState.set(next);
                        setCompareIds(next);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <img src={college.image} alt={`${college.name} campus`} className="h-32 w-full rounded-xl object-cover" width={1280} height={832} loading="lazy" />
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className="rounded bg-emerald-500 px-2 py-1 text-xs font-medium text-[#03120f]">{college.collegeType}</span>
                      <span className="inline-flex items-center gap-1 rounded bg-amber-400/15 px-2 py-1 text-xs text-amber-300"><Star className="h-3.5 w-3.5 fill-current" /> {college.rating}</span>
                    </div>
                    <p className="mt-3 truncate text-base font-bold text-white">{college.name}</p>
                    <p className="mt-1 inline-flex items-center gap-1 text-sm text-[#9babc3]"><MapPin className="h-3.5 w-3.5" /> {college.city}, {college.state}</p>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <CompareRow label="Rating" values={compared.map((c) => `${c.rating}/5`)} bestId={bestOverallId} ids={compared.map((c) => c.id)} bestLabel="Best Overall" />
            <CompareRow label="Tuition Fee (Annual)" values={compared.map((c) => formatINR(c.fees.tuition))} bestId={bestBudgetId} ids={compared.map((c) => c.id)} bestLabel="Best Budget" />
            <CompareRow label="Hostel Fee (Annual)" values={compared.map((c) => formatINR(c.fees.hostel))} bestId={bestBudgetId} ids={compared.map((c) => c.id)} bestLabel="Best Budget" />
            <CompareRow label="Mess Fee (Annual)" values={compared.map((c) => formatINR(c.fees.mess))} bestId={bestBudgetId} ids={compared.map((c) => c.id)} bestLabel="Best Budget" />
            <CompareRow label="Total Cost (Annual)" values={compared.map((c) => formatINR(c.annualCost))} bestId={bestBudgetId} ids={compared.map((c) => c.id)} bestLabel="Best Budget" />
            <CompareRow label="Average Package" values={compared.map((c) => formatLPA(c.averagePackageLpa))} bestId={bestPlacementId} ids={compared.map((c) => c.id)} bestLabel="Best Placement" />
            <CompareRow label="Highest Package" values={compared.map((c) => formatLPA(c.highestPackageLpa))} bestId={bestPlacementId} ids={compared.map((c) => c.id)} bestLabel="Best Placement" />
            <CompareRow label="Placement %" values={compared.map((c) => `${c.placementRate}%`)} bestId={bestPlacementId} ids={compared.map((c) => c.id)} bestLabel="Best Placement" />
            <CompareRow label="Scholarships" values={compared.map((c) => (c.scholarshipAvailable ? "Yes" : "Limited"))} ids={compared.map((c) => c.id)} />
            <CompareRow label="Hostel Facilities" values={compared.map((c) => `${c.hostelFacilities.length} features`)} ids={compared.map((c) => c.id)} />
            <CompareRow label="Campus Area" values={compared.map((c) => `${c.campusAreaAcres} Acres`)} ids={compared.map((c) => c.id)} />
            <CompareRow label="Accreditation" values={compared.map((c) => c.accreditation.join(", "))} ids={compared.map((c) => c.id)} />
            <CompareRow label="Top Recruiters" values={compared.map((c) => c.recruiters.slice(0, 3).join(", "))} ids={compared.map((c) => c.id)} />
            <CompareRow label="Student Reviews" values={compared.map((c) => `${c.rating}/5 (${c.reviews.length * 90}+ )`)} bestId={bestOverallId} ids={compared.map((c) => c.id)} bestLabel="Best Overall" />
          </tbody>
        </table>
      </Card>

      {winner ? (
        <Card className="mt-5 rounded-2xl border-primary/30 bg-primary/5 p-5">
          <div className="inline-flex items-center gap-2 text-primary">
            <Trophy className="h-5 w-5" />
            <span className="font-semibold">Winner Recommendation</span>
          </div>
          <p className="mt-2 text-lg font-semibold">{winner.name}</p>
          <p className="text-sm text-muted-foreground">
            Best overall mix of rating, placement outcomes, and affordability for budget-conscious students.
          </p>
        </Card>
      ) : null}
    </AppLayout>
  );
}

function mapApiCollegeToUiCollege(college: ApiCollege): College {
  const firstCourse = college.courses?.[0];
  const firstFee = college.fees?.[0] || firstCourse?.fees?.[0];
  const firstPlacement = college.placements?.[0] || firstCourse?.placements?.[0];
  const gallery = college.gallery_images?.length ? college.gallery_images : [college.cover_image_url || "/images/campus-1.jpg"];
  const annualCost = firstFee?.total_annual_cost || 0;

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
    averagePackageLpa: firstPlacement?.average_package || 0,
    highestPackageLpa: firstPlacement?.highest_package || 0,
    placementRate: firstPlacement?.placement_percentage || 0,
    scholarshipAvailable: college.scholarships?.some((item) => item.scholarship_available) || false,
    scholarships: college.scholarships?.map((item) => item.title) || [],
    accreditation: college.accreditations || [],
    approvals: college.approvals || [],
    affiliation: college.affiliation,
    campusAreaAcres: 0,
    establishedYear: college.established_year,
    recruiters: normalizeStringArray(firstPlacement?.top_recruiters),
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
  top_recruiters: string[] | string;
}

function normalizeStringArray(value?: string[] | string | null): string[] {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  const delimiter = value.includes("|") ? "|" : value.includes(",") ? "," : " ";
  return value
    .split(delimiter)
    .map((item) => item.trim())
    .filter(Boolean);
}

function CompareRow({
  label,
  values,
  ids,
  bestId,
  bestLabel,
}: {
  label: string;
  values: string[];
  ids: number[];
  bestId?: number;
  bestLabel?: string;
}) {
  return (
    <tr className="border-b border-[#1d2a3c] last:border-b-0">
      <td className="bg-[#101a2e] px-6 py-5 font-semibold text-[#d7e0ee]">
        {label}
        <span className="mt-1 block text-xs font-normal text-[#72829b]">{metricCategory(label)}</span>
      </td>
      {values.map((value, index) => {
        const isBest = bestId != null && ids[index] === bestId;
        return (
          <td key={`${label}-${ids[index]}`} className={`border-l border-[#1d2a3c] px-5 py-5 align-middle ${isBest ? "bg-emerald-400/[0.035]" : ""}`}>
            <div className="flex items-center justify-between gap-3">
              <div className={isBest ? "font-semibold text-emerald-300" : "text-[#d7e0ee]"}>{value}</div>
              {isBest && bestLabel ? (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-emerald-400/35 bg-emerald-400/10 px-2 py-1 text-xs font-semibold text-emerald-300">
                  <Check className="h-3.5 w-3.5" /> {bestLabel}
                </span>
              ) : null}
            </div>
          </td>
        );
      })}
    </tr>
  );
}

function metricCategory(label: string) {
  if (label.includes("Fee") || label.includes("Cost")) return "Cost";
  if (label.includes("Package") || label.includes("Placement")) return "Career";
  if (label.includes("Rating") || label.includes("Reviews")) return "General";
  return "Details";
}
