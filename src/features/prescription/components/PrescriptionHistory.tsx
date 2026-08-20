import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { usePrescriptionHistory } from "../hooks/usePrescriptions";
import { usePharmacyActions } from "@/features/pharmacy/hooks/usePharmacyQueue";
import { printPrescription } from "../utils/print";
import { patientNameFor } from "@/services/prescription";
import { PrescriptionSummary } from "./PrescriptionSummary";

type PrescriptionHistoryProps = {
  patientId: string;
};

export function PrescriptionHistory({ patientId }: PrescriptionHistoryProps) {
  const { data, isLoading, error, reload } = usePrescriptionHistory(patientId);
  const { run, running, error: actionError } = usePharmacyActions();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data || data.length === 0) {
    return (
      <EmptyState title="No prescriptions" description="Prescriptions will appear here when issued." />
    );
  }

  const handleDispatch = async (id: string) => {
    const ok = await run("dispatch", id);
    if (ok) reload();
  };

  return (
    <div className="flex flex-col gap-3">
      {actionError && (
        <p className="rounded-card border border-status-danger-soft bg-status-danger-soft p-3 text-sm text-status-danger">
          {actionError}
        </p>
      )}
      {data.map((prescription) => (
        <PrescriptionSummary
          key={prescription.id}
          prescription={prescription}
          actions={
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => printPrescription(prescription, patientNameFor(patientId), patientId)}
              >
                Print
              </Button>
              {prescription.status === "prescribed" && (
                <Button
                  size="sm"
                  disabled={running === prescription.id}
                  onClick={() => handleDispatch(prescription.id)}
                >
                  {running === prescription.id ? "Sending..." : "Send to pharmacy"}
                </Button>
              )}
            </>
          }
        />
      ))}
    </div>
  );
}