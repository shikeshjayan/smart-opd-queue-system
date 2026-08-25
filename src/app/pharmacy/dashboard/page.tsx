"use client";

import { usePharmacyQueue, usePharmacyActions } from "@/features/pharmacy/hooks/usePharmacyQueue";
import { StockList } from "@/features/pharmacy/components/StockList";
import { PrescriptionQueue } from "@/features/pharmacy/components/PrescriptionQueue";

export default function PharmacyDashboardPage() {
  const { data: stats, isLoading } = usePharmacyQueue();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pharmacy Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Prescription queue and medicine inventory</p>
      </div>

      <StockList hospitalId="hos_001" />
      <PrescriptionQueue />
    </div>
  );
}