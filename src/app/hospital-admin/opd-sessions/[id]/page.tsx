"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useHospitalAdmin } from "@/features/hospital-admin/hospital-context";
import { hospitalOpsServerApi } from "@/features/hospital-admin/api/hospital-ops.server";
import { useAsync } from "@/lib/use-async";
import { PageHeader } from "@/features/hospital-admin/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/feedback/empty-state";

type SessionDetail = {
  id: string;
  hospitalId: string;
  departmentId: string;
  departmentName?: string;
  roomCode?: string | null;
  doctorId?: string | null;
  date: string;
  startTime: string;
  endTime: string;
  state: string;
  plannedCapacity: number;
  tokensIssued: number;
  tokensCompleted: number;
  pauseReason?: string | null;
  expectedResumeAt?: string | null;
};

type QueueRow = {
  id?: string;
  tokenNumber: string;
  patientName?: string | null;
  priority?: string;
};

export default function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { hospitalId } = useHospitalAdmin();
  const { data: session, isLoading, reload } = useAsync(
    () => hospitalOpsServerApi.getSession(id) as Promise<SessionDetail | null>,
    [id]
  );
  void hospitalId;

  if (isLoading) return <Skeleton className="h-96 w-full" />;
  if (!session) {
    return <EmptyState title="Session not found" description="It may have been removed." />;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={session.departmentName ?? "OPD Session"}
        description={`${session.date} · ${session.startTime}–${session.endTime}${session.roomCode ? ` · Room ${session.roomCode}` : ""}`}
        actions={
          <Link
            href="/hospital-admin/opd-sessions"
            className="rounded-btn border border-ink-300 px-4 py-2 text-sm font-medium text-ink-700 hover:bg-surface-muted"
          >
            All Sessions
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <Badge variant={session.state === "active" ? "success" : session.state === "paused" ? "warning" : "default"}>
          {session.state}
        </Badge>
        {session.pauseReason && (
          <span className="text-sm text-status-warning">⚠ {session.pauseReason}</span>
        )}
        <span className="text-sm text-ink-500">
          {session.tokensIssued} issued · {session.tokensCompleted} completed · capacity {session.plannedCapacity}
        </span>
      </div>

      <SessionQueue sessionId={id} onChanged={reload} />
    </div>
  );
}

function SessionQueue({ sessionId, onChanged }: { sessionId: string; onChanged: () => void }) {
  const { data: queue, isLoading } = useAsync(
    () => hospitalOpsServerApi.listSessionQueue(sessionId) as Promise<QueueRow[]>,
    [sessionId]
  );

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  return (
    <div className="overflow-hidden rounded-card border border-ink-200 shadow-card">
      <div className="bg-surface-muted px-4 py-3 text-sm font-medium text-ink-700">Waiting queue</div>
      {!queue || queue.length === 0 ? (
        <p className="px-4 py-6 text-sm text-ink-400">No patients waiting in this session.</p>
      ) : (
        <ul className="divide-y divide-ink-100">
          {queue.map((row) => (
            <li key={row.tokenNumber} className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="font-mono font-semibold text-ink-900">{row.tokenNumber}</span>
              <span className="text-ink-600">{row.patientName ?? "Walk-in"}</span>
              <Badge variant={row.priority === "emergency" ? "danger" : row.priority === "priority" ? "warning" : "default"}>
                {row.priority ?? "normal"}
              </Badge>
            </li>
          ))}
        </ul>
      )}
      {/* refresh hook kept for future live polling */}
      <button type="button" onClick={onChanged} className="hidden" aria-hidden>
        refresh
      </button>
    </div>
  );
}
