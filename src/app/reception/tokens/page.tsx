"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { CancelTokenDialog } from "@/features/token/components/CancelTokenDialog";
import { TokenList } from "@/features/token/components/TokenList";
import { TokenSummary } from "@/features/token/components/TokenSummary";
import {
  useOpdAvailability,
  useRegistrationActions,
} from "@/features/registration/hooks/useRegistration";
import { useReception } from "@/features/registration/reception-context";
import { printToken } from "@/features/token/utils/print";
import type { OPDToken, TokenFilters, TokenCancelReason } from "@/features/registration/types/registration.types";
import { useTokens } from "@/features/registration/hooks/useRegistration";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";
import { EmptyState } from "@/components/feedback/empty-state";

const STATUS_OPTIONS: Array<{ value: TokenFilters["status"]; label: string }> = [
  { value: "waiting", label: "Waiting" },
  { value: "called", label: "Called" },
  { value: "in_consultation", label: "Consulting" },
  { value: "completed", label: "Completed" },
  { value: "skipped", label: "Skipped" },
  { value: "cancelled", label: "Cancelled" },
  { value: "no_show", label: "No Show" },
];

export default function ReceptionTokensPage() {
  const { hospital, hospitalId } = useReception();
  const opds = useOpdAvailability(hospitalId);
  const [filters, setFilters] = useState<TokenFilters>({});
  const tokens = useTokens(filters);
  const actions = useRegistrationActions();

  const [cancelTarget, setCancelTarget] = useState<OPDToken | null>(null);
  const [reissueTarget, setReissueTarget] = useState<OPDToken | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const departmentOptions = useMemo(
    () => [...new Map((opds.data ?? []).map((opd) => [opd.departmentId, opd.departmentName])).entries()],
    [opds.data]
  );
  const opdOptions = useMemo(
    () => (opds.data ?? []).filter((opd) => !filters.departmentId || opd.departmentId === filters.departmentId),
    [opds.data, filters.departmentId]
  );

  function refresh() {
    void tokens.reload();
  }

  async function handleCancel(reason: TokenCancelReason) {
    if (!cancelTarget) return;
    const ok = await actions.cancel(cancelTarget.tokenNumber, reason);
    if (ok) {
      setCancelTarget(null);
      setMessage(`Token ${cancelTarget.tokenNumber} cancelled (${reason}).`);
      refresh();
    }
  }

  async function handleReissue() {
    if (!reissueTarget) return;
    const replacement = await actions.reissue(reissueTarget.tokenNumber);
    if (replacement) {
      setReissueTarget(null);
      setMessage(`Token ${reissueTarget.tokenNumber} reissued as ${replacement.tokenNumber}.`);
      refresh();
    }
  }

  const list = tokens.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Today&apos;s Tokens</h1>
        <p className="mt-1 text-sm text-ink-500">
          {hospital?.name} &middot; {list.length} tokens shown
        </p>
      </div>

      {message && (
        <p className="rounded-card border border-status-success-soft bg-status-success-soft px-4 py-3 text-sm text-status-success">
          {message}
        </p>
      )}

      <div className="flex flex-wrap items-end gap-3 rounded-card border border-ink-200 bg-surface p-4 shadow-card">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-700">Department</span>
          <Select
            value={filters.departmentId ?? ""}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, departmentId: e.target.value || undefined, opdId: undefined }))
            }
            aria-label="Filter by department"
          >
            <option value="">All departments</option>
            {departmentOptions.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </Select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-700">OPD</span>
          <Select
            value={filters.opdId ?? ""}
            onChange={(e) => setFilters((prev) => ({ ...prev, opdId: e.target.value || undefined }))}
            aria-label="Filter by OPD"
          >
            <option value="">All OPDs</option>
            {opdOptions.map((opd) => (
              <option key={opd.opdId} value={opd.opdId}>
                {opd.opdName}
              </option>
            ))}
          </Select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-700">Status</span>
          <Select
            value={filters.status ?? ""}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, status: (e.target.value || undefined) as TokenFilters["status"] }))
            }
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </label>
        <label className="block min-w-[10rem] flex-1">
          <span className="mb-1 block text-sm font-medium text-ink-700">Token / Patient</span>
          <Input
            type="search"
            value={filters.query ?? ""}
            onChange={(e) => setFilters((prev) => ({ ...prev, query: e.target.value }))}
            placeholder="e.g. A-040 or Rahul"
          />
        </label>
        {(filters.departmentId || filters.opdId || filters.status || filters.query) && (
          <Button variant="outline" onClick={() => setFilters({})}>
            Clear
          </Button>
        )}
      </div>

      <TokenSummary tokens={list} />

      {tokens.isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : tokens.error ? (
        <ErrorState message={tokens.error} onRetry={tokens.reload} />
      ) : list.length === 0 ? (
        <EmptyState title="No tokens match" description="Try adjusting your filters." />
      ) : (
        <TokenList
          tokens={list}
          actions={(token) => (
            <>
              <button
                type="button"
                onClick={() =>
                  printToken({
                    tokenNumber: token.tokenNumber,
                    patientName: token.patientName,
                    departmentName: token.departmentName,
                    opdName: token.opdName,
                    hospitalName: hospital?.name ?? "",
                    date: token.createdAt,
                  })
                }
                className="rounded-btn border border-ink-300 px-2.5 py-1 text-xs font-medium text-ink-700 transition-colors hover:bg-ink-100"
              >
                Print
              </button>
              {token.status !== "cancelled" ? (
                <button
                  type="button"
                  onClick={() => setCancelTarget(token)}
                  className="rounded-btn border border-status-danger-soft px-2.5 py-1 text-xs font-medium text-status-danger transition-colors hover:bg-status-danger-soft"
                >
                  Cancel
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setReissueTarget(token)}
                  className="rounded-btn border border-brand-600 px-2.5 py-1 text-xs font-medium text-brand-700 transition-colors hover:bg-brand-50"
                >
                  Reissue
                </button>
              )}
            </>
          )}
        />
      )}

      <CancelTokenDialog
        open={cancelTarget !== null}
        tokenNumber={cancelTarget?.tokenNumber ?? ""}
        patientName={cancelTarget?.patientName ?? ""}
        busy={actions.busy}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancel}
      />

      <Dialog open={reissueTarget !== null} onClose={() => setReissueTarget(null)} title="Reissue Token">
        <p className="text-sm text-ink-700">
          Reissue token{" "}
          <span className="font-mono font-semibold">{reissueTarget?.tokenNumber}</span> for{" "}
          <span className="font-medium">{reissueTarget?.patientName}</span>? The original stays on
          record as cancelled and the new token links back to it.
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="ghost" disabled={actions.busy} onClick={() => setReissueTarget(null)}>
            Cancel
          </Button>
          <Button disabled={actions.busy} onClick={handleReissue}>
            {actions.busy ? "Reissuing..." : "Reissue"}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}