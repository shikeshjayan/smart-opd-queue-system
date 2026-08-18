"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authMockApi } from "@/features/auth/api/auth.mock";
import { OTPForm } from "@/features/auth/components/OTPForm";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { destinationFor } from "@/features/auth/roles";

export default function VerifyPage() {
  const router = useRouter();
  const { authorize } = useAuth();
  const [params] = useState(() =>
    typeof window === "undefined" ? null : new URLSearchParams(window.location.search)
  );
  const phone = params?.get("phone");
  const next = params?.get("next");

  async function handleVerify(otp: string) {
    if (!phone) return false;
    const session = await authMockApi.verifyPatientOtp(phone, otp);
    if (!session) return false;
    authorize(session.user);
    router.push(destinationFor(session.user.role, next));
    return true;
  }

  if (!phone) {
    return (
      <div className="rounded-card border border-ink-200 bg-surface p-6 text-center shadow-card">
        <h1 className="text-xl font-semibold text-ink-900">Verify Your Phone</h1>
        <p className="mt-2 text-sm text-ink-500">
          Enter a one-time code sent to your mobile number.
        </p>
        <Link
          href="/patient-login"
          className="mt-5 inline-flex h-11 items-center rounded-btn bg-brand-600 px-5 text-sm font-medium text-white transition-colors hover:bg-brand-700"
        >
          Start Patient Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-card border border-ink-200 bg-surface p-6 text-center shadow-card">
      <h1 className="text-xl font-semibold text-ink-900">Verify Your Phone</h1>
      <div className="mt-4">
        <OTPForm description={`Enter the 6-digit code sent to ${phone}.`} onVerify={handleVerify} />
      </div>
    </div>
  );
}