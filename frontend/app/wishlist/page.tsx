"use client";

import { Building2, Heart, MapPin, Star, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { AppLayout } from "@/components/college/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { colleges, formatINR, formatLPA, type College } from "@/lib/college-data";
import { COLLEGE_STATE_EVENT, wishlistState } from "@/lib/college-state";

export default function WishlistPage() {
  const [wishIds, setWishIds] = useState<number[]>([]);

  useEffect(() => {
    const sync = () => setWishIds(wishlistState.get());

    sync();
    window.addEventListener(COLLEGE_STATE_EVENT, sync);
    window.addEventListener("storage", sync);

    return () => {
      window.removeEventListener(COLLEGE_STATE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const savedColleges = useMemo(() => colleges.filter((college) => wishIds.includes(college.id)), [wishIds]);

  const removeCollege = (id: number) => {
    const next = wishIds.filter((item) => item !== id);
    setWishIds(next);
    wishlistState.set(next);
  };

  return (
    <AppLayout>
      <section className="relative overflow-hidden rounded-2xl bg-[#101f21] px-4 py-5 text-[#f7efd9] shadow-2xl shadow-black/20 sm:px-6">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full border-[38px] border-[#314244]/50" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-[#243436]/70" />

        <div className="relative">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#d6c091]/25 bg-[#243436]/80 px-3 py-1 text-xs font-semibold text-[#d6c091]">
                <Heart className="h-3.5 w-3.5" />
                Saved Colleges
              </div>
              <h1 className="mt-2 text-2xl font-bold text-[#f7efd9]">Wishlist</h1>
              <p className="mt-1 text-sm text-[#d8cfb8]">{savedColleges.length} colleges saved for review</p>
            </div>
            <Link href="/colleges">
              <Button className="rounded-lg bg-[#1d706d] text-white hover:bg-[#185d5a]">Explore Colleges</Button>
            </Link>
          </div>

          {savedColleges.length ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {savedColleges.map((college) => (
                <WishlistCollegeCard key={college.id} college={college} onRemove={removeCollege} />
              ))}
            </div>
          ) : (
            <Card className="relative overflow-hidden rounded-2xl border-[#d6c091]/25 bg-[#f3e8c9] p-8 text-center text-[#172325] shadow-lg shadow-black/20">
              <div className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-[#e2d3aa]" />
              <div className="relative mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#1d706d] text-[#f7efd9]">
                <Heart className="h-7 w-7" />
              </div>
              <h2 className="relative mt-4 text-2xl font-bold">No colleges saved yet</h2>
              <p className="relative mx-auto mt-2 max-w-md text-sm text-[#536062]">
                Save colleges from listings to compare fees, placements, and admission options later.
              </p>
              <Link href="/colleges" className="relative mt-5 inline-flex">
                <Button className="rounded-lg bg-[#1d706d] text-white hover:bg-[#185d5a]">Explore Colleges</Button>
              </Link>
            </Card>
          )}
        </div>
      </section>
    </AppLayout>
  );
}

function WishlistCollegeCard({ college, onRemove }: { college: College; onRemove: (id: number) => void }) {
  return (
    <Card className="overflow-hidden rounded-2xl border-[#d6c091]/40 bg-[#f3e8c9] text-[#172325] shadow-lg shadow-black/20">
      <div className="grid gap-3 p-3 sm:grid-cols-[180px_1fr]">
        <img
          src={college.image}
          alt={`${college.name} campus`}
          className="h-36 w-full rounded-xl object-cover sm:h-full"
          width={1280}
          height={832}
          loading="lazy"
        />

        <div className="min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <h2 className="line-clamp-1 text-lg font-bold text-[#172325]">{college.name}</h2>
              <p className="mt-1 flex items-center gap-1 text-sm text-[#536062]">
                <MapPin className="h-4 w-4" />
                {college.city}, {college.state}
              </p>
            </div>
            <Badge className="gap-1 rounded-md bg-[#e0cf9f] text-[#172325] hover:bg-[#e0cf9f]">
              <Star className="h-3.5 w-3.5 fill-[#1d706d] text-[#1d706d]" />
              {college.rating}/5
            </Badge>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
            <Metric label="Annual Cost" value={formatINR(college.annualCost)} />
            <Metric label="Avg. Package" value={formatLPA(college.averagePackageLpa)} />
            <Metric label="Placement" value={`${college.placementRate}%`} />
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <Button
              variant="outline"
              className="h-10 rounded-lg border-[#b69858]/50 bg-transparent text-[#172325] hover:bg-[#efe4c8]"
              onClick={() => onRemove(college.id)}
            >
              <Trash2 className="h-4 w-4" />
              Remove from Wishlist
            </Button>
            <Link href={`/college/${college.slug}`}>
              <Button className="h-10 rounded-lg bg-[#1d706d] text-white hover:bg-[#185d5a]">
                <Building2 className="h-4 w-4" />
                View Details
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-[#536062]">{label}</p>
      <p className="mt-1 font-bold text-[#172325]">{value}</p>
    </div>
  );
}
