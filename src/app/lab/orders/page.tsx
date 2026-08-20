"use client";

import { useMemo, useState } from "react";
import { useLabOverview } from "@/features/diagnostics/hooks/useDiagnosticResults";
import { LabOrderCard } from "@/features/lab/components/LabOrderCard";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";
import { EmptyState } from "@/components/feedback/empty-state";

type Stage = "all" | "ordered" | "processing" | "completed" | "rejected";

const STAGES: Array<{ value: Stage; label: string }> = [
  { value: "all", label: "All" },
  { value: "ordered", label: "Pending collection" },
  { value: "processing", label: "In processing" },
  { value: "completed", label: "Completed" },
  { value: "rejected", label: "Rejected" },
];

export default function LabOrdersPage() {
  const { data, isLoading, error, reload } = useLabOverview();
  const [stage, setStage] = useState<Stage>("all");

  const orderIds = useMemo(() => {
    const set = new Set<string>();
    for (const specimen of data?.specimens ?? []) {
      if (specimen.status === "rejected") set.add(specimen.orderId);
    }
    return set;
  }, [data]);

  const filtered = useMemo(() => {
    const orders = data?.orders ?? [];
    return orders.filter((order) => {
      if (stage === "all") return true;
      if (stage === "ordered") return order.status === "ordered";
      if (stage === "processing")
        return order.status === "processing" || order.status === "sample_collected";
      if (stage === "completed") return order.status === "completed";
      return orderIds.has(order.id) && order.status !== "completed";
    });
  }, [data, stage, orderIds]);

  const countFor = (value: Stage) => {
    const orders = data?.orders ?? [];
    if (value === "all") return orders.length;
    if (value === "ordered") return orders.filter((o) => o.status === "ordered").length;
    if (value === "processing")
      return orders.filter((o) => o.status === "processing" || o.status === "sample_collected").length;
    if (value === "completed") return orders.filter((o) => o.status === "completed").length;
    return orders.filter((o) => orderIds.has(o.id) && o.status !== "completed").length;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return <ErrorState message={error ?? "Unable to load orders."} onRetry={reload} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Lab Orders</h1>
        <p className="mt-1 text-sm text-ink-500">Sample collection, processing and completion</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {STAGES.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            aria-pressed={stage === value}
            onClick={() => setStage(value)}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              stage === value
                ? "border-brand-600 bg-brand-50 text-brand-700"
                : "border-ink-300 text-ink-600 hover:bg-ink-100"
            }`}
          >
            {label} ({countFor(value)})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No orders in this stage" description="Orders will appear here as they flow through the laboratory." />
      ) : (
        <ol className="flex flex-col gap-4">
          {filtered.map((order) => (
            <li key={order.id}>
              <LabOrderCard
                order={order}
                patientName={data.patients[order.patientId] ?? "Patient"}
                onChanged={reload}
              />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}