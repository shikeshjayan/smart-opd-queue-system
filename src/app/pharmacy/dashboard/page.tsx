"use client";

import { usePharmacyDashboard } from "@/features/pharmacy/hooks/usePharmacyDashboard";
import { StockList, type StockBatchView } from "@/features/pharmacy/components/StockList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";

export default function PharmacyDashboardPage() {
  const { data, isLoading, error, reload } = usePharmacyDashboard();

  if (isLoading)
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-1/2" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  if (error || !data)
    return <ErrorState message={error ?? "Unable to load pharmacy dashboard."} onRetry={reload} />;

  const { stats, lowStock, expiring, inventory } = data;

  const statCards = [
    { label: "Pending", value: stats.pending },
    { label: "Partially dispensed", value: stats.partiallyDispensed },
    { label: "Completed today", value: stats.completedToday },
    { label: "Low stock", value: stats.lowStockCount },
  ];

  const stockViews: StockBatchView[] = inventory.flatMap((s) =>
    s.batches.map((b) => ({
      id: b.stockId,
      medicineName: s.medicineName,
      batchNumber: b.batchNumber,
      quantity: b.quantity,
      expiryDate: b.expiryDate,
      status: b.status as "available" | "expired" | "blocked",
    }))
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pharmacy Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Prescription queue and medicine inventory</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((c) => (
          <Card key={c.label}>
            <CardHeader>
              <CardTitle className="text-sm font-medium">{c.label}</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">{c.value}</CardContent>
          </Card>
        ))}
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
          <h3 className="font-semibold mb-2">Low stock alerts ({lowStock.length})</h3>
          {lowStock.length === 0 ? (
            <p className="text-sm text-ink-500">All medicines above minimum levels.</p>
          ) : (
            <ol className="flex flex-col gap-2">
              {lowStock.map((a) => (
                <li key={a.medicineId} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{a.medicineName}</span>
                  <Badge variant="danger">
                    {a.current} / {a.minimum}
                  </Badge>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
          <h3 className="font-semibold mb-2">Expiring soon ({expiring.length})</h3>
          {expiring.length === 0 ? (
            <p className="text-sm text-ink-500">No batches expiring soon.</p>
          ) : (
            <ol className="flex flex-col gap-2">
              {expiring.map((a) => (
                <li key={a.stockId} className="flex items-center justify-between text-sm">
                  <span className="font-medium">
                    {a.medicineName} &middot; {a.batchNumber}
                  </span>
                  <Badge variant="warning">
                    {a.daysToExpiry}d &middot; {a.quantity} left
                  </Badge>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      <section>
        <h3 className="font-semibold mb-2">Inventory</h3>
        <StockList batches={stockViews} />
      </section>
    </div>
  );
}