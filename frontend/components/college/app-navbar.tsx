"use client";

import { BarChart3, GraduationCap, Heart, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { COLLEGE_STATE_EVENT, compareState, wishlistState } from "@/lib/college-state";

const navItems = [
  { label: "Home", href: "/" as const },
  { label: "Colleges", href: "/colleges" as const },
  { label: "Compare", href: "/compare" as const },
  { label: "Guides", href: "/guides" as const },
  { label: "Scholarships", href: "/scholarships" as const },
  { label: "About Us", href: "/about-us" as const },
];

export function AppNavbar() {
  const path = usePathname();
  const [wishlistCount, setWishlistCount] = useState(0);
  const [compareCount, setCompareCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const sync = () => {
      setWishlistCount(wishlistState.get().length);
      setCompareCount(compareState.get().length);
    };
    sync();
    window.addEventListener(COLLEGE_STATE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(COLLEGE_STATE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const isActive = (route: string) => path === route;

  return (
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
                isActive(item.href) ? "bg-[#1d706d] text-white" : "text-[#f7efd9] hover:bg-white/10"
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
          <Button variant="outline" size="sm" className="border-white/20 bg-transparent text-[#f7efd9] hover:bg-white/10 hover:text-white">
            Sign In
          </Button>
          <Link href="/apply">
            <Button size="sm" className="bg-[#1d706d] text-white hover:bg-[#185d5a]">
              Apply Through Us
            </Button>
          </Link>
        </div>

        <button
          type="button"
          className="grid h-9 w-9 place-items-center rounded-md border border-white/15 lg:hidden"
          onClick={() => setOpen((prev) => !prev)}
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {open ? (
        <div className="fixed inset-x-0 bottom-0 z-[60] border-t border-white/10 bg-[#121c20] px-4 pb-6 pt-4 shadow-2xl shadow-black/40 lg:hidden">
          <nav className="grid gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`rounded-md px-3 py-2 text-sm font-medium ${
                  isActive(item.href) ? "bg-[#1d706d] text-white" : "hover:bg-white/10"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Link href="/apply" onClick={() => setOpen(false)} className="pt-2">
              <Button className="w-full bg-[#1d706d] text-white hover:bg-[#185d5a]">Apply Through Us</Button>
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
