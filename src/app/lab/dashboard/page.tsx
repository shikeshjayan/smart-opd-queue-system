"use client";

import Link from "next/link";
import { useLabOverview } from "@/features/diagnostics/hooks/useDiagnosticResults";
import { DiagnosticOrderSummary } from "@/features/diagnostics/components/DiagnosticOrderSummary";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";

export default function LabDashboardPage() {
  const { data, isLoading, error, reload } = useLabOverview();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return <ErrorState message={error ?? "Unable to load laboratory overview."} onRetry={reload} />;
  }

  const { orders, patients } = data;
  const today = new Date().toISOString().slice(0, 10);
  const stats = [
    {
      label: "Today's Orders",
      value: orders.filter((o) => (o.orderedAt ?? o.createdAt).startsWith(today)).length,
    },
    { label: "Pending Collection", value: orders.filter((o) => o.status === "ordered").length },
    {
      label: "Processing",
      value: orders.filter((o) => o.status === "processing" || o.status === "sample_collected").length,
    },
    { label: "Completed", value: orders.filter((o) => o.status === "completed").length },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Laboratory</h1>
        <p className="mt-1 text-sm text-ink-500">Daily workflow overview</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-500">{stat.label}</p>
            <p className="mt-1 text-3xl font-bold tabular-nums text-ink-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <section aria-labelledby="recent-orders-title">
        <div className="flex items-center justify-between gap-2">
          <h2 id="recent-orders-title" className="text-lg font-semibold text-ink-900">
            Recent Orders
          </h2>
          <Link href="/lab/orders" className="text-sm font-medium text-brand-700 hover:underline">
            View all
          </Link>
        </div>
        <div className="mt-3 flex flex-col gap-2">
          {orders.length === 0 ? (
            <p className="text-sm text-ink-500">No orders yet.</p>
          ) : (
            orders.slice(0, 6).map((order) => (
              <DiagnosticOrderSummary
                key={order.id}
                order={order}
                patientName={patients[order.patientId] ?? "Patient"}
                actions={
                  <Link
                    href={`/lab/orders`}
                    className="rounded-btn border border-brand-600 px-3 py-1.5 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50"
                  >
                    View
                  </Link>
                }
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
}