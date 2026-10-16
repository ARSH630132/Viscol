"use client";

import { ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";

import { AppLayout } from "@/components/college/layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { isTestAdminEmail, sendOtp, testAdminLogin, verifyOtp } from "@/lib/auth-client";

const validateForm = (form: { name: string; mobile: string; email: string }) => {
  if (form.name.trim().length < 2) return "Name must be at least 2 characters";
  if (!/^[6-9]\d{9}$/.test(form.mobile.trim())) return "Mobile must be exactly 10 digits and start with 6, 7, 8, or 9";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return "Please enter a valid email address";
  return "";
};

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/colleges";
  const [form, setForm] = useState({ name: "", mobile: "", email: "" });
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    const email = form.email.trim().toLowerCase();
    const isTestAdmin = isTestAdminEmail(email);
    const validationError = isTestAdmin
      ? (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? "" : "Please enter a valid email address")
      : validateForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError("");
    try {
      if (isTestAdmin) {
        await testAdminLogin(email);
        toast.success("Login complete");
        router.push(redirectTo);
        return;
      }

      await sendOtp({
        name: form.name.trim(),
        mobile: form.mobile.trim(),
        email: form.email.trim().toLowerCase(),
      });
      setOtpSent(true);
      toast.success("OTP sent to your email");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to continue");
    } finally {
      setLoading(false);
    }
  };

  const onVerify = async () => {
    if (!/^\d{6}$/.test(otp.trim())) {
      setError("OTP must be 6 digits");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await verifyOtp({
        name: form.name.trim(),
        mobile: form.mobile.trim(),
        email: form.email.trim().toLowerCase(),
        otp: otp.trim(),
      });
      toast.success("Login complete");
      router.push(redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to verify OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
  <AppLayout>
    <section className="relative flex min-h-[calc(100vh-7rem)] items-center justify-center bg-[#061f21] px-4 text-[#d8eff0]">
  <Link
    href="/"
    className="absolute left-6 top-5 inline-flex items-center gap-2 text-sm font-medium text-[#2aa6a0]"
  >
    <ArrowLeft className="h-4 w-4" />
    Back to home
  </Link>

  <div className="mx-auto max-w-[700px]">
<Card className="w-[450px] rounded-2xl border border-[#21484b] bg-[#0d3032] p-5 shadow-xl shadow-black/25">
         <div className="text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#238a84] text-white">
              <ShieldCheck className="h-6 w-6" />
            </span>

            <h1 className="mt-4 text-2xl font-bold text-white">
              Login with College Visitor
            </h1>

            <p className="mt-2 text-sm text-[#9bc9cc]">
              {otpSent ? `Enter the OTP sent to ${form.email.trim().toLowerCase()}.` : "Continue with your basic student details."}
            </p>
          </div>

          {!otpSent ? (
          <div className="mx-auto w-[450px]">
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-[#9bc9cc]">Full Name</span>
              <Input
                className="h-11 border-[#285356] bg-[#0b2a2c] text-white placeholder:text-[#8eb0b4]"
                placeholder="Enter your full name"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-medium text-[#9bc9cc]">Mobile Number</span>
              <Input
                className="h-11 border-[#285356] bg-[#0b2a2c] text-white placeholder:text-[#8eb0b4]"
                inputMode="numeric"
                maxLength={10}
                placeholder="Enter your mobile number"
                value={form.mobile}
                onChange={(event) => setForm((prev) => ({ ...prev, mobile: event.target.value.replace(/\D/g, "") }))}
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-medium text-[#9bc9cc]">Email Address</span>
              <Input
                className="h-11 border-[#285356] bg-[#0b2a2c] text-white placeholder:text-[#8eb0b4]"
                type="email"
                placeholder="Enter your email address"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                onKeyDown={(event) => {
                  if (event.key === "Enter") onSubmit();
                }}
              />
            </label>
          </div>
          ) : (
          <div className="mx-auto w-[450px]">
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-[#9bc9cc]">Email OTP</span>
              <Input
                className="h-11 border-[#285356] bg-[#0b2a2c] text-center text-lg tracking-[0.35em] text-white placeholder:text-[#8eb0b4]"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={otp}
                onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))}
                onKeyDown={(event) => {
                  if (event.key === "Enter") onVerify();
                }}
              />
            </label>

            <div className="mt-3 flex items-center justify-between text-sm">
              <button
                type="button"
                className="text-[#2aa6a0] hover:text-white"
                disabled={loading}
                onClick={() => {
                  setOtpSent(false);
                  setOtp("");
                  setError("");
                }}
              >
                Change details
              </button>
              <button type="button" className="text-[#2aa6a0] hover:text-white" disabled={loading} onClick={onSubmit}>
                Resend OTP
              </button>
            </div>
          </div>
          )}

          {error ? <p className="mt-5 rounded-md bg-red-950/60 px-3 py-2 text-sm text-red-200">{error}</p> : null}

          <Button
            className="mt-6 h-12 w-full rounded-lg bg-[#25948e] text-base font-semibold text-white hover:bg-[#1f827c]"
            disabled={loading}
            onClick={otpSent ? onVerify : onSubmit}
          >
            {loading ? "Continuing..." : otpSent ? "Verify OTP" : isTestAdminEmail(form.email) ? "Test Admin Login" : "Send OTP"}
          </Button>
        </Card>
      </div>
    </section>
  </AppLayout>
);
}
