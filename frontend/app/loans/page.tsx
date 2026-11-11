"use client";

import { AppLayout } from "@/components/college/layout";
import { StudentLoans } from "@/components/loans/loan-management";

export default function LoansPage() {
  return (
    <AppLayout>
      <StudentLoans />
    </AppLayout>
  );
}
