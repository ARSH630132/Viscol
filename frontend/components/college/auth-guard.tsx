"use client";

import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";

import { AUTH_STATE_EVENT, getMe } from "@/lib/auth-client";

const publicRoutes = ["/about-us", "/guides", "/register"];

export function AuthGuard({ children }: { children: ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const isPublicRoute = publicRoutes.includes(path);
  const [authState, setAuthState] = useState({ path: "", allowed: false });

  useEffect(() => {
    if (isPublicRoute) return;

    let active = true;

    const check = () => {
      getMe()
        .then((user) => {
          if (!active) return;
          if (user) {
            setAuthState({ path, allowed: true });
            return;
          }

          setAuthState({ path, allowed: false });
          router.replace(`/register?redirect=${encodeURIComponent(path)}`);
        })
        .catch(() => {
          if (!active) return;
          setAuthState({ path, allowed: false });
          router.replace(`/register?redirect=${encodeURIComponent(path)}`);
        });
    };

    check();
    window.addEventListener(AUTH_STATE_EVENT, check);

    return () => {
      active = false;
      window.removeEventListener(AUTH_STATE_EVENT, check);
    };
  }, [isPublicRoute, path, router]);

  if (isPublicRoute) return children;
  if (authState.path !== path || !authState.allowed) return null;

  return children;
}
