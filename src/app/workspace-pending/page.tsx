"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthShell } from "@/features/auth/components/AuthShell";
import { LogoutButton } from "@/features/auth/components/LogoutButton";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { roleLabel } from "@/features/auth/roles";

export default function WorkspacePendingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  function goHome() {
    setBusy(true);
    if (user) router.push(`/patient/dashboard`);
    else router.push("/login");
  }

  return (
    <AuthShell>
      <div className="rounded-card border border-ink-200 bg-surface p-8 text-center shadow-card">
        <h1 className="text-xl font-semibold text-ink-900">Workspace coming in Phase 8</h1>
        <p className="mt-2 text-sm text-ink-600">
          Your account is recognised as{" "}
          <span className="font-medium text-ink-900">
            {user ? roleLabel(user.role) : "staff"}
          </span>
          . The reception / registration and clinical desk workspaces are designed in the next phase
          of the product.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={goHome}
            disabled={busy}
            className="inline-flex h-11 items-center justify-center rounded-btn bg-brand-600 px-6 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
          >
            Go to Dashboard
          </button>
          <Link
            href="/login"
            className="inline-flex h-11 items-center justify-center rounded-btn border border-ink-300 px-6 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-100"
          >
            Back to Sign In
          </Link>
        </div>
        <div className="mt-4 flex justify-center">
          <LogoutButton />
        </div>
      </div>
    </AuthShell>
  );
}