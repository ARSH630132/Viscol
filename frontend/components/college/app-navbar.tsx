"use client";

import { BarChart3, ChevronDown, GraduationCap, Heart, LogOut, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AUTH_STATE_EVENT, getMe, logout, type AuthUser } from "@/lib/auth-client";
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
  const [user, setUser] = useState<AuthUser | null>(null);
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
          
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="flex h-10 items-center gap-2 rounded-lg border border-white/15 bg-white/[0.03] px-2.5 text-sm transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d6c091]">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-[#1d706d] text-xs font-bold text-white">
                    {user.name.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="max-w-28 truncate font-medium">{user.name}</span>
                  <ChevronDown className="h-4 w-4 text-[#d6c091]" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60 border-white/10 bg-[#121c20] p-1.5 text-[#f7efd9] shadow-xl shadow-black/30">
                <DropdownMenuLabel className="px-3 py-2.5 font-normal">
                  <p className="truncate font-semibold text-white">{user.name}</p>
                  <p className="mt-0.5 truncate text-xs text-[#d6c091]">{user.mobile}</p>
                  <p className="mt-0.5 truncate text-xs text-white/55">{user.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                {user.role === "Admin" ? (
                  <DropdownMenuItem asChild className="cursor-pointer px-3 py-2 focus:bg-white/10 focus:text-white">
                    <Link href="/admin">Admin</Link>
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem className="cursor-pointer px-3 py-2 text-red-300 focus:bg-red-500/10 focus:text-red-200" onSelect={() => logout()}>
                  <LogOut className="h-4 w-4" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/register">
              <Button variant="outline" size="sm" className="border-white/20 bg-transparent text-[#f7efd9] hover:bg-white/10 hover:text-white">
                Login
              </Button>
            </Link>
          )}
          {user?.role === "College" ? <Link href="/college-dashboard"><Button variant="outline" size="sm" className="border-white/20 bg-transparent text-[#f7efd9] hover:bg-white/10 hover:text-white">College Dashboard</Button></Link> : null}
        
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
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open ? (
        <div className="fixed inset-x-0 bottom-0 z-[60] border-t border-white/10 bg-[#121c20] px-4 pb-6 pt-4 shadow-2xl shadow-black/40 lg:hidden">
          <div className="mb-2 flex justify-end">
            <button
              type="button"
              className="grid h-9 w-9 place-items-center rounded-md border border-white/15 text-[#f7efd9] hover:bg-white/10"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
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
            
            {user ? (
              <button
                type="button"
                className="mt-2 flex items-center justify-between rounded-md border border-white/15 px-3 py-2 text-sm"
                onClick={() => {
                  logout();
                  setOpen(false);
                }}
              >
                <span className="truncate">{user.name} · {user.mobile}</span>
                <span className="text-[#d6c091]">Logout</span>
              </button>
            ) : (
              <Link href="/register" onClick={() => setOpen(false)} className="pt-2">
                <Button variant="outline" className="w-full border-white/20 bg-transparent text-[#f7efd9] hover:bg-white/10 hover:text-white">
                  Login
                </Button>
              </Link>
            )}
          
          </nav>
        </div>
      ) : null}
    </header>
  );
}
