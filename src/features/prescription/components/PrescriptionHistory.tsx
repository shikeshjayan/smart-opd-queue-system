import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { usePrescriptionHistory } from "../hooks/usePrescriptions";
import { usePharmacyActions } from "@/features/pharmacy/hooks/usePharmacyQueue";
import { printPrescription } from "../utils/print";
import { patientNameFor } from "@/services/prescription";
import { formatDate } from "@/features/medical-records/utils/format";

type PrescriptionHistoryProps = {
  patientId: string;
};

function statusBadge(status: string) {
  if (status === "dispensed") return <Badge variant="success">Dispensed</Badge>;
  if (status === "sent_to_pharmacy") return <Badge variant="info">At pharmacy</Badge>;
  if (status === "partially_dispensed") return <Badge variant="warning">Partially dispensed</Badge>;
  if (status === "cancelled") return <Badge>Canceled</Badge>;
  return <Badge variant="default">Prescribed</Badge>;
}

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
        <div
          key={prescription.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-ink-200 px-4 py-3"
        >
          <div>
            <p className="text-sm font-medium text-ink-900">
              #{prescription.id} · {formatDate(prescription.issuedAt.slice(0, 10))}
            </p>
            <p className="text-xs text-ink-500">
              {prescription.departmentName} · {prescription.doctorName} ·{" "}
              {prescription.medicines.length} item{prescription.medicines.length === 1 ? "" : "s"}
              {prescription.status === "dispensed" && prescription.printedAt
                ? ` · printed ${formatDate(prescription.printedAt.slice(0, 10))}`
                : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {statusBadge(prescription.status)}
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
          </div>
        </div>
      ))}
    </div>
  );
}