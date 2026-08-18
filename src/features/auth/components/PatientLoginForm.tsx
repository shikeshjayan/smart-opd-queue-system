"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authMockApi } from "../api/auth.mock";
import { useAuth } from "../hooks/useAuth";
import { destinationFor } from "../roles";
import { OTPForm } from "./OTPForm";

function nextFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("next");
}

export function PatientLoginForm() {
  const router = useRouter();
  const { authorize } = useAuth();
  const [next] = useState(nextFromUrl);
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [knownName, setKnownName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const pending = await authMockApi.requestPatientOtp(phone);
      setKnownName(pending.name ?? null);
      setStep("otp");
    } catch {
      setError("Unable to send the code. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleVerify(otp: string) {
    const session = await authMockApi.verifyPatientOtp(phone, otp);
    if (!session) return false;
    authorize(session.user);
    router.push(destinationFor(session.user.role, next));
    return true;
  }

  return (
    <div className="rounded-card border border-ink-200 bg-surface p-6 shadow-card">
      <h1 className="text-xl font-semibold text-ink-900">Patient Sign In</h1>
      <p className="mt-1 text-sm text-ink-500">
        Use your registered mobile number to receive a one-time code. The identity provider and
        verification method will follow health-system requirements.
      </p>

      {step === "phone" ? (
        <form onSubmit={handleRequest} className="mt-5 flex flex-col gap-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink-700">Mobile number</span>
            <Input
              type="tel"
              inputMode="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98470 12345"
            />
          </label>
          {error && (
            <p role="alert" className="text-sm text-status-danger">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Sending code..." : "Send OTP"}
          </Button>
          <p className="text-center text-sm text-ink-500">
            <Link href="/login" className="text-brand-700 hover:underline">
              Back to sign-in options
            </Link>
          </p>
        </form>
      ) : (
        <div className="mt-5">
          <OTPForm
            description={
              knownName
                ? `A 6-digit code was sent to ${phone} for ${knownName}.`
                : `A 6-digit code was sent to ${phone}.`
            }
            busy={busy}
            onVerify={handleVerify}
            onResend={() => setError(null)}
          />
          <button
            type="button"
            onClick={() => setStep("phone")}
            className="mt-4 block w-full text-center text-sm font-medium text-brand-700 hover:underline"
          >
            Change mobile number
          </button>
        </div>
      )}
    </div>
  );
}