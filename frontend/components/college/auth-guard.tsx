"use client";

// import { usePathname, useRouter } from "next/navigation"; Login is not required for this project, so router and pathname are not needed
import { type ReactNode } from "react";
// import { useEffect, useState } from "react"; Login is not required for this project, so useEffect and useState are not needed

// import { AUTH_STATE_EVENT, getMe } from "@/lib/auth-client";

// const publicRoutes = ["/", "/about-us", "/guides", "/register"];

export function AuthGuard({ children }: { children: ReactNode }) {
  return children;

  /* Login is not required for this project, so auth guard is not needed
  const path = usePathname();
  const router = useRouter();
  const isPublicRoute = publicRoutes.includes(path);
  const [authState, setAuthState] = useState({ path: "", allowed: false });

  useEffect(() => {
    if (isPublicRoute) return;

    let active = true;
    const search = window.location.search.slice(1);
    const redirectPath = search ? `${path}?${search}` : path;
    const registerPath = `/register?redirect=${encodeURIComponent(redirectPath)}`;

    const check = () => {
      getMe()
        .then((user) => {
          if (!active) return;
          if (user) {
            setAuthState({ path, allowed: true });
            return;
          }

          setAuthState({ path, allowed: false });
          router.replace(registerPath);
        })
        .catch(() => {
          if (!active) return;
          setAuthState({ path, allowed: false });
          router.replace(registerPath);
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
  */
}
