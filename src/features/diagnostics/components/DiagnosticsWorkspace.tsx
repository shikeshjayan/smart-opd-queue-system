"use client";

import { useMemo } from "react";
import { useAsync } from "@/lib/use-async";
import { consultationMockApi } from "@/features/consultation/api/consultation.mock";
import { listEncounters } from "@/services/data";
import type { Encounter } from "@/types";
import { encounterRefFor } from "@/services/diagnostics";
import { useDoctorPatient } from "@/features/medical-records/hooks/useMedicalRecords";
import { useOrderWorkflow, usePatientOrders, useOrder } from "../hooks/useDiagnosticOrders";
import { DiagnosticOrderForm } from "./DiagnosticOrderForm";
import { DiagnosticOrderSummary } from "./DiagnosticOrderSummary";
import { DiagnosticResultView } from "./DiagnosticResultView";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { usePermissions } from "@/features/auth/hooks/useAuth";
import { useDiagnosticResultActions } from "../hooks/useDiagnosticResults";

async function resolveEncounter(patientId: string): Promise<Encounter | null> {
  const active = await consultationMockApi.getOrCreateForPatient(patientId);
  if (active?.encounter) return active.encounter;
  const history = listEncounters(patientId).filter((e) => e.status !== "cancelled");
  history.sort((a, b) => b.date.localeCompare(a.date));
  return history[0] ?? null;
}

export function DiagnosticsWorkspace({ patientId }: { patientId: string }) {
  const encounterState = useAsync(() => resolveEncounter(patientId), [patientId]);
  const patientView = useDoctorPatient(patientId);
  const orders = usePatientOrders(patientId);
  const { can } = usePermissions();
  const canOrder = can("ORDER_DIAGNOSTICS");
  const canReview = can("REVIEW_DIAGNOSTIC_RESULTS");

  const encounter = encounterState.data ?? null;
  const ref = useMemo(
    () => (encounter ? encounterRefFor(encounter) : null),
    [encounter]
  );

  const workflow = useOrderWorkflow({
    encounterId: encounter?.id ?? "",
    ref: ref ?? { patientId: "", doctorId: "", doctorName: "", hospitalId: "", hospitalName: "", departmentName: "" },
  });

  const patientName = patientView.data?.patient.name ?? "Patient";

  if (encounterState.isLoading || patientView.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (encounterState.error || !encounter) {
    return (
      <ErrorState
        message={encounterState.error ?? "No encounter available for diagnostic orders."}
        onRetry={encounterState.reload}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {canOrder && (
        <section aria-labelledby="order-title" className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
          <h2 id="order-title" className="text-lg font-semibold text-ink-900">
            Tests &amp; Diagnostics
          </h2>
          <div className="mt-3">
            <DiagnosticOrderForm
              items={workflow.items}
              updateItems={workflow.updateItems}
              clinicalNotes={workflow.clinicalNotes}
              updateNotes={workflow.updateNotes}
              saving={workflow.saving}
              error={workflow.error}
              submitting={workflow.submitting}
              onSaveDraft={workflow.saveDraft}
              onSubmit={() => void workflow.submit()}
            />
          </div>
        </section>
      )}

      <section aria-labelledby="orders-title">
        <h2 id="orders-title" className="text-lg font-semibold text-ink-900">
          Diagnostic Orders
        </h2>
        <div className="mt-3 flex flex-col gap-3">
          {orders.isLoading ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : orders.error ? (
            <ErrorState message={orders.error} onRetry={orders.reload} />
          ) : orders.data && orders.data.length > 0 ? (
            orders.data.map((order) => (
              <OrderPanel
                key={order.id}
                orderId={order.id}
                patientName={patientName}
                canReview={canReview}
              />
            ))
          ) : (
            <EmptyState title="No orders yet" description="Orders placed for this patient will appear here." />
          )}
        </div>
      </section>
    </div>
  );
}

function OrderPanel({
  orderId,
  patientName,
  canReview,
}: {
  orderId: string;
  patientName: string;
  canReview: boolean;
}) {
  const { data, isLoading, error, reload } = useOrder(orderId);
  const { review, running } = useDiagnosticResultActions();

  if (isLoading) return <Skeleton className="h-16 w-full" />;
  if (error || !data || !data[0]) {
    return <ErrorState message={error ?? "Order not found."} onRetry={reload} />;
  }
  const order = data[0];
  const specimen = data[1] ?? null;
  const orderResults = data[2] ?? [];
  const finalResult = orderResults.find(
    (r) => r.status === "final" || r.status === "amended"
  );

  return (
    <div className="flex flex-col gap-2">
      <DiagnosticOrderSummary
        order={order}
        patientName={specimen ? undefined : patientName}
      />
      {finalResult && (
        <div className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
          <DiagnosticResultView
            result={finalResult}
            context={
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-ink-500">Specimen {specimen ? specimen.type : "—"}</p>
                {finalResult.status !== "draft" && !finalResult.reviewedAt && canReview && (
                  <Button
                    size="sm"
                    disabled={running === `review:${finalResult.id}`}
                    onClick={async () => {
                      const ok = await review(finalResult.id, "doc_001");
                      if (ok) reload();
                    }}
                  >
                    {running === `review:${finalResult.id}` ? "Reviewing..." : "Review Result"}
                  </Button>
                )}
                {finalResult.reviewedAt && <p className="text-xs text-status-success">Reviewed</p>}
              </div>
            }
          />
        </div>
      )}
    </div>
  );
}