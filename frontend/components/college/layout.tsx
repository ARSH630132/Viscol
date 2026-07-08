import type { ReactNode } from "react";

import { AuthGuard } from "@/components/college/auth-guard";
import { AppNavbar } from "@/components/college/app-navbar";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <AppNavbar />
      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        <AuthGuard>{children}</AuthGuard>
      </main>
    </div>
  );
}
