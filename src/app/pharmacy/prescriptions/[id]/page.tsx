"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useAsync } from "@/lib/use-async";
import { prescriptionService } from "@/services/prescription";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";
import { usePharmacyActions } from "@/features/pharmacy/hooks/usePharmacyQueue";

export default function PharmacyPrescriptionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: rx, isLoading, error, reload } = useAsync(
    async () => prescriptionService.getById(id),
    [id]
  );
  const { run, running } = usePharmacyActions();

  if (isLoading) return <div className="flex flex-col gap-4"><Skeleton className="h-10 w-1/2" /><Skeleton className="h-48 w-full" /></div>;
  if (error || !rx) return <ErrorState message={error ?? "Prescription not found."} onRetry={reload} />;

  const handleDispense = async () => {
    const items = rx.medicines.map((m) => ({ medicineId: m.medicineId, itemId: m.id, qty: 1 }));
    const ok = await run("dispense", rx.id, { items });
    if (ok) reload();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Link href="/pharmacy/prescriptions" className="text-sm font-medium text-brand-700 hover:underline">&larr; Queue</Link>
      </div>

      <div className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
        <h2 className="text-xl font-bold">Prescription {rx.id}</h2>
        <p className="text-sm text-ink-500">Patient: {rx.patientId} &middot; Doctor: {rx.doctorName}</p>
        <p className="text-sm text-ink-500">Status: {rx.status} &middot; Workflow: {rx.workflowStatus}</p>
      </div>

      <section>
        <h3 className="font-semibold mb-2">Medicines</h3>
        <div className="flex flex-col gap-3">
          {rx.medicines.map((m) => (
            <div key={m.id} className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
              <p className="font-medium">{m.medicineName} ({m.dosage})</p>
              <p className="text-sm text-ink-500">{m.frequency} &middot; {m.duration.value} {m.duration.unit}</p>
            </div>
          ))}
        </div>
      </section>

      {rx.status !== "dispensed" && (
        <Button onClick={handleDispense} disabled={running === rx.id} className="self-start">
          {running === rx.id ? "Dispensing..." : "Mark as Dispensed"}
        </Button>
      )}
    </div>
  );
}
