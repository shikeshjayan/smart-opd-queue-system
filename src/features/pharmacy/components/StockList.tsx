import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface StockBatchView {
  id: string;
  medicineName: string;
  batchNumber: string;
  quantity: number;
  expiryDate: string;
  status: "available" | "expired" | "blocked";
}

export function StockList({ batches }: { hospitalId?: string; batches?: StockBatchView[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {(batches ?? []).map((b) => (
        <Card key={b.id}>
          <CardHeader>
            <CardTitle className="text-sm font-medium">{b.medicineName}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold">{b.quantity}</span>
              <Badge variant={b.quantity < 50 ? "danger" : "default"}>
                {b.batchNumber}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Expires: {b.expiryDate}</p>
          </CardContent>
        </Card>
      ))}
      {(!batches || batches.length === 0) && (
        <p className="text-sm text-muted-foreground col-span-full">No batches registered.</p>
      )}
    </div>
  );
}