"use client";

import { usePathname } from "next/navigation";

import { AppNavbar } from "@/components/college/app-navbar";

export function SiteNavbar() {
  const pathname = usePathname();

  return (
    <div className={pathname === "/" ? "hidden" : undefined}>
      <AppNavbar />
    </div>
  );
}
