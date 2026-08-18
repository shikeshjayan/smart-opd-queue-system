"use client";

import Link from "next/link";
import { AuthLoading } from "@/features/auth/components/AuthLoading";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { roleHome } from "@/features/auth/roles";

export default function UnauthorizedPage() {
  const { status, user } = useAuth();
  const home =
    status === "authenticated" && user ? roleHome(user.role) : "/login";

  if (status === "loading") {
    return (
      <div className="rounded-card border border-ink-200 bg-surface p-6 shadow-card">
        <AuthLoading label="Checking access..." />
      </div>
    );
  }

  return (
    <div className="rounded-card border border-ink-200 bg-surface p-8 text-center shadow-card">
      <span
        aria-hidden="true"
        className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-status-danger-soft text-xl font-bold text-status-danger"
      >
        !
      </span>
      <h1 className="mt-4 text-xl font-semibold text-ink-900">Access Restricted</h1>
      <p className="mt-2 text-sm text-ink-600">
        You don&apos;t have permission to access this section. Your access is limited to your
        assigned role and organisation scope.
      </p>
      <Link
        href={home}
        className="mt-6 inline-flex h-11 items-center justify-center rounded-btn bg-brand-600 px-6 text-sm font-medium text-white transition-colors hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}