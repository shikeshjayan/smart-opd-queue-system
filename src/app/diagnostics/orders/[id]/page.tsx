"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useAsync } from "@/lib/use-async";
import { diagnosticsMockApi } from "@/features/diagnostics/api/diagnostics.mock";
import { OrderStatus } from "@/features/diagnostics/components/OrderStatus";
import { ResultStatusBadge } from "@/features/diagnostics/components/ResultStatus";
import { ScheduleStudy } from "@/features/diagnostics/components/ScheduleStudy";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";
import type { DiagnosticOrderItem } from "@/services/diagnostics/types";
import { testById } from "@/services/diagnostics/catalog";

export default function DiagnosticsOrderDetailPage() {
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

  if (isLoading) return <div className="flex flex-col gap-4"><Skeleton className="h-10 w-1/2" /><Skeleton className="h-48 w-full" /></div>;
  if (error || !data) return <ErrorState message={error ?? "Order not found."} onRetry={reload} />;

  const { order, results } = data;
  const resultByTest = new Map(results.map((r) => [r.testId, r]));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Link href="/diagnostics/orders" className="text-sm font-medium text-brand-700 hover:underline">&larr; Orders</Link>
      </div>

      <div className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">{order.id}</h2>
            <p className="text-sm text-ink-500">Patient: {order.patientId} &middot; Doctor: {order.doctorName}</p>
          </div>
          <OrderStatus status={order.status} />
        </div>
      </div>

      <section>
        <h3 className="text-lg font-semibold mb-3">Studies</h3>
        <ol className="flex flex-col gap-3">
          {order.items.map((item: DiagnosticOrderItem) => {
            const result = resultByTest.get(item.testId);
            const test = testById(item.testId);
            return (
              <li key={item.testId} className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{item.testName}</p>
                    <p className="text-sm text-ink-500">
                      {item.workflow?.status ?? order.status}
                      {item.workflow?.scheduledAt && ` · Scheduled: ${item.workflow.scheduledAt}`}
                      {item.workflow?.performedAt && ` · Performed: ${item.workflow.performedAt}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {result && <ResultStatusBadge status={result.status} />}
                    {result && (
                      <Link href={`/diagnostics/reports/${result.id}`} className="text-sm font-medium text-brand-700 hover:underline">
                        View report
                      </Link>
                    )}
                  </div>
                </div>
                {test?.schedulingMode === "slot" && !item.workflow?.scheduledAt && order.status !== "cancelled" && (
                  <div className="mt-3">
                    <ScheduleStudy orderId={order.id} />
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
