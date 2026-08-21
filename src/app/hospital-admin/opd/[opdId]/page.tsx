"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useHospitalAdmin } from "@/features/hospital-admin/hospital-context";
import { hospitalOpsService } from "@/services/hospital-ops";
import {
  useAdminOpdDetail,
  useAdminMutations,
} from "@/features/hospital-admin/hooks/useHospitalAdmin";
import { HealthBadge } from "@/features/hospital-admin/components/HealthBadge";
import { StatusConfirmDialog } from "@/features/hospital-admin/components/StatusConfirmDialog";
import { OpdStatusBadge } from "@/features/opd/components/OpdStatusBadge";
import { QueueStatusBanner } from "@/features/queue/components/QueueStatusBanner";
import { queueOperationalState } from "@/features/queue/utils/queue-status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";
import { formatTime } from "@/features/hospital-admin/utils/format";

export default function OpdDetailPage() {
  const params = useParams<{ opdId: string }>();
  const opdId = params.opdId;
  const { hospitalId, hospital } = useHospitalAdmin();
  const { data, isLoading, error, reload } = useAdminOpdDetail(hospitalId, opdId);
  const mutations = useAdminMutations();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pauseOpen, setPauseOpen] = useState(false);
  const [pauseReason, setPauseReason] = useState("");

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return <ErrorState message={error ?? "OPD session not found."} onRetry={reload} />;
  }

  const { opd, department, doctor, counts, health } = data;

  const nextStatus: "open" | "closed" =
    opd.status === "open" || opd.status === "full" ? "closed" : "open";

  async function handleConfirmToggle() {
    await mutations.setOpdStatus(opd.id, nextStatus);
    void hospitalOpsService.logOpdStatusChange(`${department?.name ?? ""} ${opd.name}`.trim(), nextStatus);
    setConfirmOpen(false);
    reload();
  }

  async function handlePause() {
    await mutations.setOpdStatus(opd.id, "paused", pauseReason.trim() || undefined);
    void hospitalOpsService.logOpdStatusChange(
      `${department?.name ?? ""} ${opd.name}`.trim(),
      "paused",
      undefined,
      pauseReason.trim() || undefined
    );
    setPauseOpen(false);
    setPauseReason("");
    reload();
  }

  async function handleResume() {
    await mutations.setOpdStatus(opd.id, "open");
    void hospitalOpsService.logOpdStatusChange(`${department?.name ?? ""} ${opd.name}`.trim(), "open");
    reload();
  }

  const breakdown = [
    { id: "total", label: "Total Tokens", value: counts.total },
    { id: "waiting", label: "Waiting", value: counts.waiting },
    { id: "inConsultation", label: "In Consultation", value: counts.inConsultation },
    { id: "completed", label: "Completed", value: counts.completed },
    { id: "skipped", label: "Skipped", value: counts.skipped },
    { id: "cancelled", label: "Cancelled", value: counts.cancelled },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/hospital-admin/opd"
          className="text-sm text-brand-600 hover:underline focus-visible:outline-2 focus-visible:outline-brand-600"
        >
          &larr; Back to OPD Sessions
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold text-ink-900">{opd.name}</h1>
            <p className="mt-1 text-sm text-ink-500">
              {department?.name} &middot; {hospital?.name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <OpdStatusBadge status={opd.status} />
            {opd.status === "paused" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResume}
                disabled={mutations.busy}
              >
                Resume Session
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPauseOpen(true)}
                disabled={mutations.busy}
              >
                Pause Session
              </Button>
            )}
            {opd.status !== "paused" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmOpen(true)}
                disabled={mutations.busy}
              >
                {nextStatus === "open" ? "Open Session" : "Close Session"}
              </Button>
            )}
          </div>
        </div>
      </div>

      {queueOperationalState(opd.status, counts.waiting) !== "normal" && (
        <QueueStatusBanner
          state={queueOperationalState(opd.status, counts.waiting)}
          opdName={opd.name}
          reason={opd.statusReason}
          updatedAt={opd.statusUpdatedAt}
        />
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
          <p className="text-xs text-ink-500">Timings</p>
          <p className="mt-1 text-lg font-semibold text-ink-900">
            {formatTime(opd.startTime)} – {formatTime(opd.endTime)}
          </p>
        </div>
        <div className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
          <p className="text-xs text-ink-500">Doctor</p>
          <p className="mt-1 text-lg font-semibold text-ink-900">
            {doctor ? doctor.name : "Unassigned"}
          </p>
        </div>
        <div className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
          <p className="text-xs text-ink-500">Now Serving</p>
          <p className="mt-1 text-lg font-semibold text-ink-900">{opd.currentlyServing ?? "—"}</p>
        </div>
        <div className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
          <p className="text-xs text-ink-500">Queue Health</p>
          <div className="mt-1">
            <HealthBadge health={health} />
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Queue Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {breakdown.map((item) => (
              <div key={item.id} className="rounded-token bg-surface-muted p-3 text-center">
                <dt className="text-xs text-ink-500">{item.label}</dt>
                <dd className="mt-1 text-xl font-semibold text-ink-900">{item.value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-ink-500">OPD ID</dt>
              <dd className="mt-0.5 font-mono text-sm text-ink-900">{opd.id}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-500">Department</dt>
              <dd className="mt-0.5 text-sm text-ink-900">
                <Link
                  href={`/hospital-admin/departments/${department?.id}`}
                  className="text-brand-600 hover:underline"
                >
                  {department?.name}
                </Link>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-ink-500">Estimated wait</dt>
              <dd className="mt-0.5 text-sm text-ink-900">
                {opd.estimatedWaitMinutes ? `${opd.estimatedWaitMinutes} min` : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-ink-500">Status</dt>
              <dd className="mt-0.5">
                <Badge variant={opd.status === "open" ? "success" : "default"}>{opd.status}</Badge>
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <StatusConfirmDialog
        open={confirmOpen}
        title={`${nextStatus === "open" ? "Open" : "Close"} ${opd.name}?`}
        message={
          nextStatus === "closed"
            ? `Closing ${opd.name} will stop new token issuance. Patients currently waiting can still be served.`
            : `Opening ${opd.name} will allow patients to book tokens again.`
        }
        confirmLabel={nextStatus === "open" ? "Open" : "Close"}
        busy={mutations.busy}
        onConfirm={handleConfirmToggle}
        onClose={() => setConfirmOpen(false)}
      />

      <Dialog open={pauseOpen} onClose={() => setPauseOpen(false)} title="Pause Session">
        <p className="text-sm text-ink-700">
          Pausing {opd.name} stops new token issuance and shows a temporary status to patients.
        </p>
        <label className="mt-4 block">
          <span className="text-sm font-medium text-ink-900">Reason (shown to patients)</span>
          <textarea
            value={pauseReason}
            onChange={(e) => setPauseReason(e.target.value)}
            rows={3}
            placeholder="e.g. Doctor unavailable"
            className="mt-1 w-full rounded-btn border border-ink-300 px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-600 focus:outline-none"
          />
        </label>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="ghost" disabled={mutations.busy} onClick={() => setPauseOpen(false)}>
            Cancel
          </Button>
          <Button disabled={mutations.busy} onClick={handlePause}>
            {mutations.busy ? "Pausing…" : "Pause Session"}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
