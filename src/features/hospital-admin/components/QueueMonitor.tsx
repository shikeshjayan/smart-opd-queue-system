"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useHospitalAdmin } from "../hospital-context";
import { useQueueOverview } from "../hooks/useHospitalAdmin";
import { useRealtime } from "@/features/realtime/hooks/useRealtime";
import { HealthBadge } from "./HealthBadge";
import { OpdStatusBadge } from "@/features/opd/components/OpdStatusBadge";
import { AVG_CONSULTATION_MINUTES } from "@/services/hospital-ops";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/feedback/empty-state";

export function QueueMonitor() {
  const { hospitalId } = useHospitalAdmin();
  const { data: items, isLoading, error, reload } = useQueueOverview(hospitalId);
  const { status, subscribe } = useRealtime();

  useEffect(() => {
    const listener = () => {
      reload();
    };
    return subscribe("*", listener);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscribe]);

  if (isLoading) return <Skeleton className="h-72 w-full" />;
  if (error || !items) return <EmptyState title="Unable to load live queue" description={error ?? ""} />;
  if (items.length === 0) {
    return <EmptyState title="No active queues" description="OPD sessions will appear here when open." />;
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="flex items-center gap-2 text-xs text-ink-500">
        <span
          aria-hidden="true"
          className={`inline-block h-2 w-2 rounded-full ${
            status === "connected" ? "bg-status-success" : "bg-status-danger"
          }`}
        />
        {status === "connected" ? "Live · updates in real time" : "Reconnecting…"}
      </p>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => {
          const avgWait = item.waiting * AVG_CONSULTATION_MINUTES;
          return (
            <article key={item.opdId} className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Link
                    href={`/hospital-admin/opd/${item.opdId}`}
                    className="font-semibold text-brand-600 hover:underline focus-visible:outline-2 focus-visible:outline-brand-600"
                  >
                    {item.opdName}
                  </Link>
                  <p className="text-xs text-ink-500">{item.departmentName}</p>
                </div>
                <HealthBadge health={item.health} />
              </div>

              <div className="mt-3 flex items-baseline gap-2" aria-live="polite">
                <span className="text-xs uppercase tracking-wide text-ink-400">Now serving</span>
                <span className="text-2xl font-bold tabular-nums text-ink-900">{item.nowServing ?? "—"}</span>
              </div>

              <dl className="mt-3 grid grid-cols-4 gap-2 text-center">
                <div className="rounded-token bg-surface-muted p-1.5">
                  <dt className="text-[10px] uppercase text-ink-400">Waiting</dt>
                  <dd className="text-sm font-bold tabular-nums text-ink-900">{item.waiting}</dd>
                </div>
                <div className="rounded-token bg-surface-muted p-1.5">
                  <dt className="text-[10px] uppercase text-ink-400">Done</dt>
                  <dd className="text-sm font-bold tabular-nums text-ink-900">{item.completed}</dd>
                </div>
                <div className="rounded-token bg-surface-muted p-1.5">
                  <dt className="text-[10px] uppercase text-ink-400">Avg wait</dt>
                  <dd className="text-sm font-bold tabular-nums text-ink-900">~{avgWait}m</dd>
                </div>
                <div className="rounded-token flex flex-col items-center justify-center gap-0.5 bg-surface-muted p-1.5">
                  <dt className="text-[10px] uppercase text-ink-400">Status</dt>
                  <dd>
                    <OpdStatusBadge status={item.status} />
                  </dd>
                </div>
              </dl>
            </article>
          );
        })}
      </div>
    </div>
  );
}
