"use client";

import Link from "next/link";

function nextFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("next");
}

export function LoginChooser() {
  const next = nextFromUrl();
  const query = next ? `?next=${encodeURIComponent(next)}` : "";

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3">
        <Link
          href={`/patient-login${query}`}
          className="group rounded-card border border-ink-200 bg-surface p-4 shadow-card transition-colors hover:border-brand-600"
        >
          <p className="font-semibold text-ink-900">Patient</p>
          <p className="mt-1 text-sm text-ink-500">OTP sign-in with your registered mobile number.</p>
        </Link>
        <Link
          href={`/staff-login${query}`}
          className="group rounded-card border border-ink-200 bg-surface p-4 shadow-card transition-colors hover:border-brand-600"
        >
          <p className="font-semibold text-ink-900">Hospital / Staff</p>
          <p className="mt-1 text-sm text-ink-500">Staff ID &amp; password for hospital and government workspaces.</p>
        </Link>
      </div>

      <h2 className="sr-only">Sign-in options</h2>
    </div>
  );
}
