"use client";

import Link from "next/link";
import { useAsync } from "@/lib/use-async";
import { diagnosticsMockApi } from "@/features/diagnostics/api/diagnostics.mock";
import { ResultStatusBadge } from "@/features/diagnostics/components/ResultStatus";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";

export default function DiagnosticsReportsPage() {
  const { data: orders, isLoading, error, reload } = useAsync(() => diagnosticsMockApi.listAll(), []);

  if (isLoading) return <div className="flex flex-col gap-4"><Skeleton className="h-10 w-1/2" /><Skeleton className="h-20 w-full" /></div>;
  if (error || !orders) return <ErrorState message={error ?? "Unable to load reports."} onRetry={reload} />;

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-bold">Diagnostic Reports</h2>
      <p className="text-sm text-muted-foreground">Reports from imaging and other diagnostic procedures</p>

      <div className="flex flex-col gap-3">
        {orders.length === 0 && <EmptyState title="No reports" description="Diagnostic reports will appear here." />}
        {orders.map((o) => (
          <div key={o.id} className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{o.id} &middot; {o.patientId}</p>
                <p className="text-sm text-ink-500">{o.items.map((i) => i.testName).join(", ")}</p>
              </div>
              <Link href={`/diagnostics/orders/${o.id}`} className="text-sm font-medium text-brand-700 hover:underline">View order</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
