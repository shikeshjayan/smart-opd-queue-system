"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAsync } from "@/lib/use-async";
import { authMockApi } from "../api/auth.mock";
import { useAuth } from "../hooks/useAuth";
import { destinationFor, roleLabel } from "../roles";
import type { UserRole } from "../types/auth.types";

function nextFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("next");
}

export function LoginChooser() {
  const router = useRouter();
  const { authorize } = useAuth();
  const { data: demoAccounts, isLoading } = useAsync(() => authMockApi.listDemoAccounts(), []);
  const [next] = useState(nextFromUrl);
  const [demoBusy, setDemoBusy] = useState<UserRole | null>(null);

  async function handleDemo(role: UserRole) {
    setDemoBusy(role);
    const session = await authMockApi.demoLogin(role);
    setDemoBusy(null);
    if (!session) return;
    authorize(session.user);
    router.push(destinationFor(role, next));
  }

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

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-ink-200" aria-hidden="true" />
        <span className="text-xs uppercase tracking-wide text-ink-400">Demo accounts</span>
        <span className="h-px flex-1 bg-ink-200" aria-hidden="true" />
      </div>

      <div className="flex flex-col gap-2">
        {isLoading ? (
          <p className="text-sm text-ink-500">Loading demo accounts...</p>
        ) : (
          demoAccounts?.map((account) => (
            <button
              key={account.user.id}
              type="button"
              disabled={demoBusy !== null}
              onClick={() => handleDemo(account.user.role)}
              className="flex items-center justify-between gap-3 rounded-btn border border-ink-300 px-4 py-2.5 text-left text-sm transition-colors hover:bg-ink-100 disabled:opacity-50"
            >
              <span>
                <span className="block font-medium text-ink-900">
                  {roleLabel(account.user.role)}
                </span>
                <span className="block text-xs text-ink-500">{account.hint}</span>
              </span>
              <span className="shrink-0 text-brand-700">
                {demoBusy === account.user.role ? "Signing in..." : "Enter →"}
              </span>
            </button>
          ))
        )}
      </div>

      <h2 className="sr-only">Sign-in options</h2>
    </div>
  );
}