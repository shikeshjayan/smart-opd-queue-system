"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MedicineDetailPage() {
  const { medicineId } = useParams<{ medicineId: string }>();
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Link href="/pharmacy/inventory" className="text-sm font-medium text-brand-700 hover:underline">&larr; Inventory</Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Medicine: {medicineId}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Batch history and transactions for this medicine will appear here.</p>
          <div className="mt-4 flex gap-2">
            <Badge variant="default">0 batches</Badge>
            <Badge variant="default">0 transactions</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
