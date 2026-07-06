"use client";

import { Bookmark, Building2, CheckCircle2, MapPin, Star } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { College } from "@/lib/college-data";
import { formatINR, formatLPA } from "@/lib/college-data";

interface CollegeCardProps {
  college: College;
  compared: boolean;
  wished: boolean;
  onToggleCompare: (id: number, checked: boolean) => void;
  onToggleWishlist: (id: number) => void;
}

export function CollegeCard({
  college,
  compared,
  wished,
  onToggleCompare,
  onToggleWishlist,
}: CollegeCardProps) {
  return (
    <article className="premium-card overflow-hidden">
      <div className="grid gap-4 p-3 sm:grid-cols-[260px_1fr] sm:p-4">
        <img
          src={college.image}
          alt={`${college.name} campus`}
          className="h-44 w-full rounded-xl object-cover"
          loading="lazy"
          width={1280}
          height={832}
        />

        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <h3 className="line-clamp-1 text-lg font-semibold">{college.name}</h3>
              <p className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {college.city}, {college.state} • {college.collegeType}
              </p>
            </div>
            <div className="inline-flex items-center gap-1 rounded-lg bg-secondary px-2 py-1 text-sm font-medium">
              <Star className="h-4 w-4 fill-primary text-primary" />
              {college.rating}/5
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{college.course}</Badge>
            {college.scholarshipAvailable ? <Badge>Scholarship Available</Badge> : null}
            {college.accreditation.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>

          <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-4">
            <Metric label="Annual Cost" value={formatINR(college.annualCost)} />
            <Metric label="Average Package" value={formatLPA(college.averagePackageLpa)} />
            <Metric label="Highest Package" value={formatLPA(college.highestPackageLpa)} />
            <Metric label="Placement Rate" value={`${college.placementRate}%`} />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Checkbox
                checked={compared}
                onCheckedChange={(value) => onToggleCompare(college.id, value === true)}
              />
              Compare
            </label>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card"
                onClick={() => onToggleWishlist(college.id)}
                aria-label="Save college"
              >
                <Bookmark className={`h-4 w-4 ${wished ? "fill-primary text-primary" : "text-muted-foreground"}`} />
              </button>
              <Link href={`/college/${college.slug}`}>
                <Button size="sm" className="gap-1">
                  <Building2 className="h-4 w-4" />
                  View Details
                </Button>
              </Link>
            </div>
          </div>

          {compared ? (
            <div className="inline-flex items-center gap-2 text-sm text-primary">
              <CheckCircle2 className="h-4 w-4" /> Added to compare tray
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p>{label}</p>
      <p className="text-base font-semibold text-foreground">{value}</p>
    </div>
  );
}
