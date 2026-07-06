"use client";

import { Trophy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { AppLayout } from "@/components/college/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { colleges, formatINR, formatLPA } from "@/lib/college-data";
import { compareState } from "@/lib/college-state";

export default function ComparePage() {
  const [compareIds, setCompareIds] = useState<number[]>([]);

  useEffect(() => {
    setCompareIds(compareState.get());
  }, []);

  const compared = useMemo(
    () => colleges.filter((college) => compareIds.includes(college.id)).slice(0, 3),
    [compareIds],
  );

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
        <Button variant="outline" onClick={() => { compareState.set([]); setCompareIds([]); }}>
          Clear Compare
        </Button>
      </div>

      <Card className="premium-card overflow-x-auto p-4">
        <table className="w-full min-w-[860px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="w-52 py-3 pr-3">Metric</th>
              {compared.map((college) => (
                <th key={college.id} className="py-3 pr-3 align-top">
                  <img
                    src={college.image}
                    alt={`${college.name} campus`}
                    className="mb-2 h-24 w-full rounded-lg object-cover"
                    width={1280}
                    height={832}
                    loading="lazy"
                  />
                  <div className="font-semibold">{college.name}</div>
                  <div className="text-xs text-muted-foreground">{college.city}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <CompareRow label="Rating" values={compared.map((c) => `${c.rating}/5`)} bestId={bestOverallId} ids={compared.map((c) => c.id)} bestLabel="Best Overall" tone="overall" />
            <CompareRow label="Tuition Fee (Annual)" values={compared.map((c) => formatINR(c.fees.tuition))} bestId={bestBudgetId} ids={compared.map((c) => c.id)} bestLabel="Best Budget" tone="budget" />
            <CompareRow label="Hostel Fee (Annual)" values={compared.map((c) => formatINR(c.fees.hostel))} bestId={bestBudgetId} ids={compared.map((c) => c.id)} bestLabel="Best Budget" tone="budget" />
            <CompareRow label="Mess Fee (Annual)" values={compared.map((c) => formatINR(c.fees.mess))} bestId={bestBudgetId} ids={compared.map((c) => c.id)} bestLabel="Best Budget" tone="budget" />
            <CompareRow label="Total Cost (Annual)" values={compared.map((c) => formatINR(c.annualCost))} bestId={bestBudgetId} ids={compared.map((c) => c.id)} bestLabel="Best Budget" tone="budget" />
            <CompareRow label="Average Package" values={compared.map((c) => formatLPA(c.averagePackageLpa))} bestId={bestPlacementId} ids={compared.map((c) => c.id)} bestLabel="Best Placement" tone="placement" />
            <CompareRow label="Highest Package" values={compared.map((c) => formatLPA(c.highestPackageLpa))} bestId={bestPlacementId} ids={compared.map((c) => c.id)} bestLabel="Best Placement" tone="placement" />
            <CompareRow label="Placement %" values={compared.map((c) => `${c.placementRate}%`)} bestId={bestPlacementId} ids={compared.map((c) => c.id)} bestLabel="Best Placement" tone="placement" />
            <CompareRow label="Scholarships" values={compared.map((c) => (c.scholarshipAvailable ? "Yes" : "Limited"))} ids={compared.map((c) => c.id)} />
            <CompareRow label="Hostel Facilities" values={compared.map((c) => `${c.hostelFacilities.length} features`)} ids={compared.map((c) => c.id)} />
            <CompareRow label="Campus Area" values={compared.map((c) => `${c.campusAreaAcres} Acres`)} ids={compared.map((c) => c.id)} />
            <CompareRow label="Accreditation" values={compared.map((c) => c.accreditation.join(", "))} ids={compared.map((c) => c.id)} />
            <CompareRow label="Top Recruiters" values={compared.map((c) => c.recruiters.slice(0, 3).join(", "))} ids={compared.map((c) => c.id)} />
            <CompareRow label="Student Reviews" values={compared.map((c) => `${c.rating}/5 (${c.reviews.length * 90}+ )`)} bestId={bestOverallId} ids={compared.map((c) => c.id)} bestLabel="Best Overall" tone="overall" />
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

function CompareRow({
  label,
  values,
  ids,
  bestId,
  bestLabel,
  tone,
}: {
  label: string;
  values: string[];
  ids: number[];
  bestId?: number;
  bestLabel?: string;
  tone?: "budget" | "placement" | "overall";
}) {
  return (
    <tr className="border-b border-border/70">
      <td className="py-3 pr-3 font-medium">{label}</td>
      {values.map((value, index) => {
        const isBest = bestId != null && ids[index] === bestId;
        return (
          <td key={`${label}-${ids[index]}`} className="py-3 pr-3 align-top">
            <div className="space-y-1">
              <div className={isBest ? "font-semibold" : ""}>{value}</div>
              {isBest && bestLabel ? (
                <Badge variant={badgeTone(tone)}>
                  {bestLabel}
                </Badge>
              ) : null}
            </div>
          </td>
        );
      })}
    </tr>
  );
}

const badgeTone = (tone?: "budget" | "placement" | "overall") => {
  if (tone === "placement") return "default" as const;
  if (tone === "overall") return "secondary" as const;
  return "outline" as const;
};