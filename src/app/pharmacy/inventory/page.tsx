"use client";

import { StockList } from "@/features/pharmacy/components/StockList";

export default function PharmacyInventoryPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold">Medicine Inventory</h2>
        <p className="text-sm text-muted-foreground">Batch-level stock tracking with FEFO ordering</p>
      </div>
      <StockList hospitalId="hos_001" />
    </div>
  );
}
