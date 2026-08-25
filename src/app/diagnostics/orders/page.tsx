"use client";

import Link from "next/link";
import { useAsync } from "@/lib/use-async";
import { diagnosticsMockApi } from "@/features/diagnostics/api/diagnostics.mock";
import { OrderStatus } from "@/features/diagnostics/components/OrderStatus";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";

export default function DiagnosticsOrdersPage() {
  const { data: orders, isLoading, error, reload } = useAsync(() => diagnosticsMockApi.listAll(), []);

  if (isLoading) return <div className="flex flex-col gap-4"><Skeleton className="h-10 w-1/2" /><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /></div>;
  if (error || !orders) return <ErrorState message={error ?? "Unable to load diagnostic orders."} onRetry={reload} />;

  const imagingOrders = orders.filter((o) => o.items.some((i) => i.category !== "laboratory"));

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-bold">Diagnostic Orders</h2>
      {imagingOrders.length === 0 ? (
        <EmptyState title="No diagnostic orders" description="Imaging and other diagnostic orders appear here." />
      ) : (
        <ol className="flex flex-col gap-3">
          {imagingOrders.map((o) => (
            <li key={o.id} className="flex items-center justify-between rounded-card border border-ink-200 bg-surface p-4 shadow-card">
              <div>
                <p className="font-medium">{o.id}</p>
                <p className="text-sm text-ink-500">{o.patientId}</p>
              </div>
              <div className="flex items-center gap-3">
                <OrderStatus status={o.status} />
                <Link href={`/diagnostics/orders/${o.id}`} className="text-sm font-medium text-brand-700 hover:underline">View</Link>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
