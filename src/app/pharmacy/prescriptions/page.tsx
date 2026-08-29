"use client";

import Link from "next/link";
import { useAsync } from "@/lib/use-async";
import { pharmacyApi } from "@/features/pharmacy/api/pharmacy.api";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";

export default function PharmacyPrescriptionsPage() {
  const { data: queue, isLoading, error, reload } = useAsync(() => pharmacyApi.getQueue(), []);

  if (isLoading) return <div className="flex flex-col gap-4"><Skeleton className="h-10 w-1/2" /><Skeleton className="h-20 w-full" /></div>;
  if (error || !queue) return <ErrorState message={error ?? "Unable to load prescriptions."} onRetry={reload} />;

  const pending = queue.filter((e) => e.status === "awaiting_dispatch");
  const partial = queue.filter((e) => e.status === "partially_dispensed");

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-bold">Prescription Queue</h2>

      <section>
        <h3 className="font-semibold mb-2">Pending ({pending.length})</h3>
        {pending.length === 0 ? (
          <EmptyState title="No pending prescriptions" description="New prescriptions will appear here." />
        ) : (
          <ol className="flex flex-col gap-3">
            {pending.map((e) => (
              <li key={e.prescriptionId} className="flex items-center justify-between rounded-card border border-ink-200 bg-surface p-4 shadow-card">
                <div>
                  <p className="font-medium">{e.prescriptionId}</p>
                  <p className="text-sm text-ink-500">{e.patientName} &middot; {e.items} items</p>
                </div>
                <Link href={`/pharmacy/prescriptions/${e.prescriptionId}`} className="text-sm font-medium text-brand-700 hover:underline">Dispense</Link>
              </li>
            ))}
          </ol>
        )}
      </section>

      {partial.length > 0 && (
        <section>
          <h3 className="font-semibold mb-2">Partially Dispensed ({partial.length})</h3>
          <ol className="flex flex-col gap-3">
            {partial.map((e) => (
              <li key={e.prescriptionId} className="flex items-center justify-between rounded-card border border-ink-200 bg-surface p-4 shadow-card">
                <div>
                  <p className="font-medium">{e.prescriptionId}</p>
                  <p className="text-sm text-ink-500">{e.patientName} &middot; {e.itemsDispensed}/{e.items} dispensed</p>
                </div>
                <Badge variant="warning">Partial</Badge>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
