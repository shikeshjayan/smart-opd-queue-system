"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import Link from "next/link";
import { tokenService } from "@/services/token";
import { DEMO_PATIENT_ID } from "@/config/app";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";
import { formatWait, formatWaitRange } from "@/features/patient/utils/format";
import { useAsync } from "@/lib/use-async";

function TokenContent() {
  const searchParams = useSearchParams();
  const opdId = searchParams.get("opd") ?? "";

  const { data: bundle, isLoading, error } = useAsync(() => {
    if (!opdId) return Promise.resolve(null);
    return tokenService.create(opdId, DEMO_PATIENT_ID);
  }, [opdId]);

  const [confirmed, setConfirmed] = useState(false);
  const [confirming, setConfirming] = useState(false);

  if (!opdId) {
    return (
      <EmptyStateInline
        title="No OPD selected"
        description="Please select an OPD session first."
        href="/patient/hospitals"
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-56 w-full" />
      </div>
    );
  }

  if (error || !bundle) {
    return <ErrorState message={error ?? "OPD not found"} />;
  }

  const { hospital, department, opd, token } = bundle;
  const wait = token.estimatedWaitMinutes ?? opd.estimatedWaitMinutes;

  function handleConfirm() {
    setConfirming(true);
    setTimeout(() => {
      setConfirmed(true);
      setConfirming(false);
    }, 300);
  }

  if (confirmed) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="rounded-card bg-brand-600 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-white">
          Token Confirmed
        </div>
        <div
          aria-label={`Token ${token.tokenNumber}`}
          className="flex h-40 w-40 items-center justify-center rounded-full bg-brand-700 text-6xl font-bold text-white shadow-token"
        >
          {token.tokenNumber}
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-ink-900">{department.name} &middot; {opd.name}</p>
          <p className="text-sm text-ink-500">{hospital.name}, {hospital.district}</p>
        </div>

        <dl className="grid grid-cols-3 gap-3 text-center w-full max-w-md">
          <div className="rounded-card border border-ink-200 bg-surface p-3 shadow-card">
            <dt className="text-xs text-ink-500">Now Serving</dt>
            <dd className="mt-1 text-lg font-semibold text-ink-900">{opd.currentlyServing ?? "—"}</dd>
          </div>
          <div className="rounded-card border border-ink-200 bg-surface p-3 shadow-card">
            <dt className="text-xs text-ink-500">Patients Ahead</dt>
            <dd className="mt-1 text-lg font-semibold text-ink-900">{token.patientsAhead}</dd>
          </div>
          <div className="rounded-card border border-ink-200 bg-surface p-3 shadow-card">
            <dt className="text-xs text-ink-500">Est. Wait</dt>
            <dd className="mt-1 text-lg font-semibold text-ink-900">{wait != null ? formatWait(wait) : "—"}</dd>
          </div>
        </dl>

        {wait != null && (
          <p className="text-sm text-ink-500">Approximate wait: {formatWaitRange(wait)}</p>
        )}

        <Link
          href={`/patient/queue?opd=${opd.id}&token=tok_001`}
          className="mt-2 flex h-12 w-full max-w-md items-center justify-center rounded-btn bg-brand-600 font-medium text-white transition-colors hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          Track Queue
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-ink-900">Confirm OPD Token</h1>

      <div className="rounded-card border border-ink-200 bg-surface p-6 shadow-card">
        <dl className="flex flex-col gap-3 text-sm">
          <div className="flex items-start justify-between">
            <dt className="font-medium text-ink-500">Hospital</dt>
            <dd className="text-right font-medium text-ink-900">{hospital.name}, {hospital.district}</dd>
          </div>
          <hr className="border-ink-100" />
          <div className="flex items-start justify-between">
            <dt className="font-medium text-ink-500">Department</dt>
            <dd className="font-medium text-ink-900">{department.name}</dd>
          </div>
          <hr className="border-ink-100" />
          <div className="flex items-start justify-between">
            <dt className="font-medium text-ink-500">OPD</dt>
            <dd className="font-medium text-ink-900">{opd.name}</dd>
          </div>
          <hr className="border-ink-100" />
          <div className="flex items-start justify-between">
            <dt className="font-medium text-ink-500">Expected Waiting Time</dt>
            <dd className="font-medium text-ink-900">{wait != null ? `~${wait} minutes` : "—"}</dd>
          </div>
          <hr className="border-ink-100" />
          <div className="flex items-start justify-between">
            <dt className="font-medium text-ink-500">Token Availability</dt>
            <dd className="font-medium text-ink-900">
              {opd.status === "open" ? "Available" : "Not available"}
            </dd>
          </div>
        </dl>
      </div>

      <div className="flex gap-3">
        <Link
          href={opd.departmentId ? `/patient/opd?department=${opd.departmentId}` : "/patient/hospitals"}
          className="flex h-11 flex-1 items-center justify-center rounded-btn border border-ink-300 font-medium text-ink-700 transition-colors hover:bg-ink-100 focus-visible:outline-2 focus-visible:outline-brand-600"
        >
          Cancel
        </Link>
        <Button
          onClick={handleConfirm}
          disabled={confirming || opd.status !== "open"}
          className="flex-1"
        >
          {confirming ? "Confirming..." : "Confirm Token"}
        </Button>
      </div>
    </div>
  );
}

function EmptyStateInline({ title, description, href }: { title: string; description: string; href: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-ink-300 p-10 text-center">
      <p className="font-medium text-ink-900">{title}</p>
      <p className="max-w-sm text-sm text-ink-500">{description}</p>
      <Link
        href={href}
        className="inline-flex h-11 items-center rounded-btn bg-brand-600 px-5 font-medium text-white transition-colors hover:bg-brand-700"
      >
        Go Back
      </Link>
    </div>
  );
}

export default function TokenPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-4">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-56 w-full" />
        </div>
      }
    >
      <TokenContent />
    </Suspense>
  );
}
