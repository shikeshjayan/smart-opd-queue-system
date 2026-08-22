"use client";

import { useDistrictComparison } from "../hooks/useStateAdminData";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";
import { EmptyState } from "@/components/feedback/empty-state";
import { Badge } from "@/components/ui/badge";

export function DistrictComparisonTable() {
  const { data, isLoading, error, reload } = useDistrictComparison();

  if (isLoading) {
    return <Skeleton className="h-48 w-full" />;
  }

  if (error || !data) {
    return <ErrorState message={error ?? "Could not load comparison data"} onRetry={reload} />;
  }

  return (
    <div className="rounded-card border border-ink-200 bg-surface shadow-card overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>District</TableHead>
              <TableHead className="text-right">Hospitals</TableHead>
              <TableHead className="text-right">Patients Today</TableHead>
              <TableHead className="text-right">Avg Wait Time</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell className="py-10 text-center">
                  <EmptyState title="No districts found" description="Comparison data is unavailable right now." />
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => (
                <TableRow key={row.districtId}>
                  <TableCell className="font-medium text-ink-900">{row.districtName}</TableCell>
                  <TableCell className="text-right">{row.hospitals.toLocaleString("en-IN")}</TableCell>
                  <TableCell className="text-right">{row.patients.toLocaleString("en-IN")}</TableCell>
                  <TableCell className="text-right">{row.avgWaitMinutes} min</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={row.status === "critical" ? "danger" : row.status === "warning" ? "warning" : "success"}>
                      {row.status === "critical" ? "High Load" : row.status === "warning" ? "Moderate" : "Healthy"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
