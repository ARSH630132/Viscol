import type { ReactNode } from "react";

import { AppNavbar } from "@/components/college/app-navbar";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <AppNavbar />
      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">{children}</main>
    </div>
  );
}
