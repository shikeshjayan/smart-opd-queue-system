"use client";

import { useState } from "react";
import { useHospitalAdmin } from "../hospital-context";
import { hospitalOpsServerApi } from "../api/hospital-ops.server";
import { useAsync } from "@/lib/use-async";
import { usePermissions } from "@/features/auth/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { inputCls, labelCls } from "@/features/consultation/utils/classes";
import Link from "next/link";
import type { OpdSessionState } from "@/types";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

type SessionRow = {
  id: string;
  departmentId: string;
  departmentName?: string;
  roomCode?: string | null;
  date: string;
  startTime: string;
  endTime: string;
  state: OpdSessionState;
  plannedCapacity: number;
  tokensIssued: number;
  tokensCompleted: number;
  pauseReason?: string | null;
};

const STATE_BADGE: Record<OpdSessionState, "success" | "warning" | "danger" | "info" | "default"> = {
  scheduled: "default",
  open: "info",
  active: "success",
  paused: "warning",
  completed: "default",
  cancelled: "danger",
};

export function SessionDayBoard() {
  const { hospitalId } = useHospitalAdmin();
  const [date, setDate] = useState(todayISO());
  const { data: sessions, isLoading, error, reload } = useAsync(
    () => hospitalOpsServerApi.listSessions(hospitalId, date) as Promise<SessionRow[]>,
    [hospitalId, date]
  );
  const [busyId, setBusyId] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [pauseTarget, setPauseTarget] = useState<SessionRow | null>(null);
  const [cancelTarget, setCancelTarget] = useState<SessionRow | null>(null);
  const { can } = usePermissions();
  const canManage = can("MANAGE_SESSIONS") || can("MANAGE_OPD");

  async function run(sessionId: string, fn: () => Promise<void>) {
    setBusyId(sessionId);
    setActionError(null);
    try {
      await fn();
      reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message.replace(/^Error:\s*/, "") : "Action failed");
    } finally {
      setBusyId("");
    }
  }

  if (isLoading) return <Skeleton className="h-96 w-full" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <label className="block">
          <span className={labelCls}>Date</span>
          <input
            className={inputCls}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value || todayISO())}
          />
        </label>
        <p className="text-sm text-ink-500">
          Sessions materialize automatically from each department&apos;s weekly schedule.
        </p>
      </div>

      {actionError && (
        <p className="text-sm text-status-danger" role="alert">
          {actionError}
        </p>
      )}

      {!sessions || sessions.length === 0 ? (
        <EmptyState
          title="No sessions for this day"
          description="Days outside the weekly schedule, holidays and closures produce no sessions."
        />
      ) : (
        <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
          {sessions.map((session) => (
            <li key={session.id} className="flex flex-col gap-3 rounded-card border border-ink-200 bg-surface p-4 shadow-card">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Link
                    href={`/hospital-admin/opd-sessions/${session.id}`}
                    className="font-medium text-brand-600 hover:underline"
                  >
                    {session.departmentName ?? session.departmentId}
                  </Link>
                  <p className="mt-0.5 font-mono text-xs text-ink-500">
                    {session.startTime}–{session.endTime}
                    {session.roomCode ? ` · ${session.roomCode}` : ""}
                  </p>
                </div>
                <Badge variant={STATE_BADGE[session.state]}>{session.state}</Badge>
              </div>

              {session.state === "paused" && session.pauseReason && (
                <p className="rounded-btn bg-status-warning/10 px-2 py-1.5 text-xs text-status-warning">
                  ⚠ Paused: {session.pauseReason}
                </p>
              )}

              <div className="grid grid-cols-3 gap-2 text-center text-xs text-ink-500">
                <div className="rounded-btn bg-surface-muted p-2">
                  <p className="font-semibold text-ink-900">{session.tokensIssued}</p>
                  issued
                </div>
                <div className="rounded-btn bg-surface-muted p-2">
                  <p className="font-semibold text-ink-900">{session.tokensCompleted}</p>
                  done
                </div>
                <div className="rounded-btn bg-surface-muted p-2">
                  <p className="font-semibold text-ink-900">{session.plannedCapacity}</p>
                  capacity
                </div>
              </div>

              {canManage && (
                <div className="flex flex-wrap items-center justify-end gap-2 border-t border-ink-100 pt-3">
                  {session.state === "scheduled" && (
                    <Button size="sm" disabled={busyId === session.id} onClick={() => void run(session.id, () => hospitalOpsServerApi.openSession(session.id))}>
                      Open
                    </Button>
                  )}
                  {session.state === "open" && (
                    <>
                      <Button size="sm" disabled={busyId === session.id} onClick={() => void run(session.id, () => hospitalOpsServerApi.activateSession(session.id))}>
                        Activate
                      </Button>
                      <Button variant="outline" size="sm" disabled={busyId === session.id} onClick={() => setPauseTarget(session)}>
                        Pause
                      </Button>
                    </>
                  )}
                  {session.state === "active" && (
                    <>
                      <Button variant="outline" size="sm" disabled={busyId === session.id} onClick={() => setPauseTarget(session)}>
                        Pause
                      </Button>
                      <Button variant="outline" size="sm" disabled={busyId === session.id} onClick={() => void run(session.id, () => hospitalOpsServerApi.completeSession(session.id))}>
                        Complete
                      </Button>
                    </>
                  )}
                  {session.state === "paused" && (
                    <>
                      <Button size="sm" disabled={busyId === session.id} onClick={() => void run(session.id, () => hospitalOpsServerApi.resumeSession(session.id))}>
                        Resume
                      </Button>
                      <Button variant="outline" size="sm" disabled={busyId === session.id} onClick={() => void run(session.id, () => hospitalOpsServerApi.completeSession(session.id))}>
                        Complete
                      </Button>
                    </>
                  )}
                  {!["completed", "cancelled"].includes(session.state) && (
                    <Button variant="outline" size="sm" disabled={busyId === session.id} onClick={() => setCancelTarget(session)}>
                      Cancel
                    </Button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <Modal open={pauseTarget !== null} onClose={() => setPauseTarget(null)} title={`Pause ${pauseTarget?.departmentName ?? ""}`}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void (async () => {
              if (!pauseTarget) return;
              const form = new FormData(e.currentTarget);
              const reason = String(form.get("reason") ?? "");
              const etaRaw = String(form.get("eta") ?? "");
              await run(pauseTarget.id, () =>
                hospitalOpsServerApi.pauseSession(
                  pauseTarget.id,
                  reason,
                  etaRaw ? Number(etaRaw) : undefined
                )
              );
              setPauseTarget(null);
            })();
          }}
          className="flex flex-col gap-3"
        >
          <label className="block">
            <span className={labelCls}>Reason</span>
            <input className={inputCls} name="reason" required placeholder="e.g. Doctor emergency" />
          </label>
          <label className="block">
            <span className={labelCls}>Expected resume (minutes)</span>
            <input className={inputCls} type="number" min={5} name="eta" placeholder="e.g. 30" />
          </label>
          <p className="text-xs text-ink-400">Waiting patients will receive a delay notice.</p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setPauseTarget(null)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busyId !== ""}>
              Pause Session
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={cancelTarget !== null} onClose={() => setCancelTarget(null)} title={`Cancel ${cancelTarget?.departmentName ?? ""}?`}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void (async () => {
              if (!cancelTarget) return;
              const form = new FormData(e.currentTarget);
              await run(cancelTarget.id, () =>
                hospitalOpsServerApi.cancelSession(cancelTarget.id, String(form.get("reason") ?? ""))
              );
              setCancelTarget(null);
            })();
          }}
          className="flex flex-col gap-3"
        >
          <p className="text-sm text-ink-500">
            Waiting tokens will be released and patients must re-book. Existing appointments are not deleted.
          </p>
          <label className="block">
            <span className={labelCls}>Reason</span>
            <input className={inputCls} name="reason" required placeholder="e.g. Staff shortage" />
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setCancelTarget(null)}>
              Back
            </Button>
            <Button type="submit" disabled={busyId !== ""}>
              Cancel Session
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
