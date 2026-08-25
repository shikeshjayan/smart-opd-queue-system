"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useAsync } from "@/lib/use-async";
import { diagnosticsMockApi } from "@/features/diagnostics/api/diagnostics.mock";
import { OrderStatus } from "@/features/diagnostics/components/OrderStatus";
import { ResultStatusBadge } from "@/features/diagnostics/components/ResultStatus";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";
import { EmptyState } from "@/components/feedback/empty-state";
import type { DiagnosticOrderItem } from "@/services/diagnostics/types";

export default function LabOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error, reload } = useAsync(
    async () => {
      const order = await diagnosticsMockApi.getOrder(id);
      if (!order) return null;
      const results = await diagnosticsMockApi.listResultsForOrder(order.id);
      return { order, results };
    },
    [id]
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }
  if (error || !data) {
    return <ErrorState message={error ?? "Order not found."} onRetry={reload} />;
  }

  const { order, results } = data;
  const resultByTest = new Map(results.map((r) => [r.testId, r]));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Link href="/lab/orders" className="text-sm font-medium text-brand-700 hover:underline">
          &larr; Orders
        </Link>
      </div>

      <div className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">{order.id}</h2>
            <p className="text-sm text-ink-500">
              Patient: {order.patientId} &middot; Doctor: {order.doctorName}
            </p>
          </div>
          <OrderStatus status={order.status} />
        </div>
      </div>

      <section>
        <h3 className="text-lg font-semibold mb-3">Tests</h3>
        {order.items.length === 0 ? (
          <EmptyState title="No tests" description="This order has no tests." />
        ) : (
          <ol className="flex flex-col gap-3">
            {order.items.map((item: DiagnosticOrderItem) => {
              const result = resultByTest.get(item.testId);
              return (
                <li
                  key={item.testId}
                  className="flex items-center justify-between rounded-card border border-ink-200 bg-surface p-4 shadow-card"
                >
                  <div>
                    <p className="font-medium">{item.testName}</p>
                    <p className="text-sm text-ink-500">
                      {item.workflow?.status ?? "ordered"}
                      {item.workflow?.sampleId && ` · Sample: ${item.workflow.sampleId}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {result ? (
                      <>
                        <ResultStatusBadge status={result.status} />
                        <Link
                          href={`/lab/results/${order.id}`}
                          className="text-sm font-medium text-brand-700 hover:underline"
                        >
                          View
                        </Link>
                      </>
                    ) : (
                      <span className="text-sm text-ink-400">Pending</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </div>
  );
}
