"use client";

import { Scale } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export function CompareTray({ count }: { count: number }) {
  if (count === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <Link href="/compare">
        <Button className="h-11 gap-2 rounded-full px-5 shadow-lg">
          <Scale className="h-4 w-4" /> Compare ({count})
        </Button>
      </Link>
    </div>
  );
}
