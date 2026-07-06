"use client";

import { CheckCircle2, ShieldCheck, Sparkles, Wallet } from "lucide-react";
import { type ReactNode, useState } from "react";
import { toast } from "sonner";

import { AppLayout } from "@/components/college/layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cityOptions, courseOptions } from "@/lib/college-data";

export default function ApplyPage() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    course: "",
    budget: "",
    city: "",
    preferredCollege: "",
  });

  return (
    <AppLayout>
      <section className="mx-auto max-w-4xl rounded-2xl border border-border bg-card p-5 shadow-sm md:p-7">
        <div className="text-center">
          <h1 className="text-3xl font-semibold">Apply Through College Visitor</h1>
          <p className="mt-2 text-muted-foreground">Get admission guidance from our experts</p>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <Benefit icon={Wallet} title="Lowest Possible Fees" />
          <Benefit icon={Sparkles} title="Scholarship Assistance" />
          <Benefit icon={ShieldCheck} title="Admission Guidance" />
          <Benefit icon={CheckCircle2} title="No Charges For Students" />
        </div>

        <Card className="premium-card mt-6 p-4 md:p-5">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Full Name">
              <Input
                placeholder="Enter your full name"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              />
            </Field>
            <Field label="Mobile Number">
              <Input
                placeholder="Enter your mobile number"
                value={form.phone}
                onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
              />
            </Field>
            <Field label="Email Address">
              <Input
                placeholder="Enter your email address"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              />
            </Field>
            <Field label="Course">
              <Select
                value={form.course || "select"}
                onValueChange={(value) => setForm((prev) => ({ ...prev, course: value === "select" ? "" : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="select">Select course</SelectItem>
                  {courseOptions.map((course) => (
                    <SelectItem key={course} value={course}>
                      {course}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Budget Range (Annual)">
              <Input
                placeholder="Select budget range"
                value={form.budget}
                onChange={(event) => setForm((prev) => ({ ...prev, budget: event.target.value }))}
              />
            </Field>
            <Field label="City">
              <Select
                value={form.city || "select"}
                onValueChange={(value) => setForm((prev) => ({ ...prev, city: value === "select" ? "" : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select city" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="select">Select city</SelectItem>
                  {cityOptions.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Preferred College (Optional)">
              <Input
                placeholder="Search for a college"
                value={form.preferredCollege}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, preferredCollege: event.target.value }))
                }
              />
            </Field>
          </div>

          <Button
            className="mt-5 h-11 w-full"
            onClick={() => {
              if (!form.name || !form.phone || !form.email || !form.course) {
                toast.error("Please complete required fields");
                return;
              }
              toast.success("Admission request submitted successfully");
              setForm({
                name: "",
                phone: "",
                email: "",
                course: "",
                budget: "",
                city: "",
                preferredCollege: "",
              });
            }}
          >
            Get Admission Assistance
          </Button>

          <p className="mt-3 text-center text-xs text-muted-foreground">
            100% Free • Secure • Trusted by Thousands of Students
          </p>
        </Card>
      </section>
    </AppLayout>
  );
}

function Benefit({ icon: Icon, title }: { icon: typeof Wallet; title: string }) {
  return (
    <Card className="premium-card p-4 text-center">
      <span className="mx-auto inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/12 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-2 text-sm font-medium">{title}</p>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="space-y-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
