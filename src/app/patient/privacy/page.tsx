"use client";

import { useState } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useConsent } from "@/features/security/hooks/useConsent";
import {
  ConsentDialog,
  type ConsentDialogTarget,
} from "@/features/security/components/ConsentDialog";
import type { ConsentRecord } from "@/features/security/api/consent.mock";

const STATUS_VARIANT = {
  granted: "success",
  withdrawn: "danger",
  expired: "warning",
} as const;

export default function PatientPrivacyPage() {
  const { user } = useAuth();
  const patientId = user?.id ?? "";
  const { consents, history, isLoading, changeStatus } = useConsent(patientId);
  const [active, setActive] = useState<ConsentRecord | null>(null);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-xl font-semibold text-ink-900">Privacy &amp; Access</h1>
        <p className="mt-1 text-sm text-ink-500">
          Control who can access your medical records and for what purpose. Every access is logged.
        </p>
      </header>

      {consents.length === 0 ? (
        <p className="rounded-card border border-ink-200 bg-surface p-6 text-center text-sm text-ink-400 shadow-card">
          No access consents recorded yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {consents.map((consent) => (
            <li
              key={consent.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-ink-200 bg-surface p-4 shadow-card"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink-900">{consent.purpose}</p>
                {consent.scopeNote && (
                  <p className="mt-0.5 text-xs text-ink-500">{consent.scopeNote}</p>
                )}
                <p className="mt-0.5 text-xs text-ink-400">
                  {consent.status === "granted"
                    ? `Granted ${new Date(consent.grantedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
                    : `Last changed ${history.find((h) => h.consentId === consent.id)?.changedAt ?? consent.grantedAt}`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={STATUS_VARIANT[consent.status]}>{consent.status}</Badge>
                {consent.status === "granted" ? (
                  <Button variant="outline" size="sm" onClick={() => setActive(consent)}>
                    Withdraw
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => setActive(consent)}>
                    Allow
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <section aria-labelledby="consent-history-heading" className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
        <h2 id="consent-history-heading" className="mb-3 text-sm font-semibold text-ink-900">
          Access History
        </h2>
        {history.length === 0 ? (
          <p className="text-sm text-ink-400">No changes yet.</p>
        ) : (
          <ol className="flex flex-col gap-2">
            {history.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-ink-700 capitalize">{entry.status}</span>
                {entry.note && <span className="hidden text-xs text-ink-400 sm:inline">{entry.note}</span>}
                <span className="tabular-nums text-xs text-ink-400">
                  {new Date(entry.changedAt).toLocaleString("en-IN", {
                    day: "numeric",
                    month: "short",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <ConsentDialog
        target={active ? { id: active.id, purpose: active.purpose, status: active.status, scopeNote: active.scopeNote } : null}
        onClose={() => setActive(null)}
        onConfirm={(status) => {
          if (!active || !patientId) return;
          void changeStatus(active, status, patientId);
        }}
      />
    </div>
  );
}
