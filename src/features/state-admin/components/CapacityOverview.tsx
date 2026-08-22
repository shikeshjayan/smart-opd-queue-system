"use client";

import { useCapacityByDistrict } from "../hooks/useStateAdminData";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";
import { EmptyState } from "@/components/feedback/empty-state";
import { Badge } from "@/components/ui/badge";

const statusVariant = {
  normal: "success",
  near_capacity: "warning",
  exceeded: "danger",
} as const;

const statusLabel = {
  normal: "Normal",
  near_capacity: "Near Capacity",
  exceeded: "Exceeded",
} as const;

const barColor = {
  normal: "bg-status-success",
  near_capacity: "bg-status-warning",
  exceeded: "bg-status-danger",
} as const;

export function CapacityOverview() {
  const { data, isLoading, error, reload } = useCapacityByDistrict();

  if (isLoading) {
    return <Skeleton className="h-48 w-full" />;
  }

  if (error || !data) {
    return <ErrorState message={error ?? "Could not load capacity data"} onRetry={reload} />;
  }

  return (
    <div className="rounded-card border border-ink-200 bg-surface shadow-card overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>District</TableHead>
              <TableHead className="text-right">OPD Capacity</TableHead>
              <TableHead className="text-right">Today's Load</TableHead>
              <TableHead className="w-52">Utilization</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center">
                  <EmptyState title="No capacity data available" description="Check back later." />
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => (
                <TableRow key={row.districtId}>
                  <TableCell className="font-medium text-ink-900">{row.districtName}</TableCell>
                  <TableCell className="text-right">{row.opdCapacity}</TableCell>
                  <TableCell className="text-right">{row.todaysLoad}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 rounded-full bg-ink-100">
                        <div
                          className={`h-full rounded-full ${barColor[row.status]}`}
                          style={{ width: `${Math.min(100, row.utilizationPercent)}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-ink-600">{row.utilizationPercent}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={statusVariant[row.status]}>{statusLabel[row.status]}</Badge>
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
                  <EmptyState title="No capacity data" description="Capacity data is unavailable right now." />
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => (
                <TableRow key={row.districtId}>
                  <TableCell className="font-medium text-ink-900">{row.districtName}</TableCell>
                  <TableCell className="text-right">{row.opdCapacity.toLocaleString("en-IN")}</TableCell>
                  <TableCell className="text-right">{row.todaysLoad.toLocaleString("en-IN")}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink-100">
                        <div
                          className={`h-full rounded-full ${barColor[row.status]}`}
                          style={{ width: `${Math.min(row.utilizationPercent, 100)}%` }}
                        />
                      </div>
                      <span className="w-10 text-right text-xs font-medium text-ink-700">
                        {row.utilizationPercent}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={statusVariant[row.status]}>{statusLabel[row.status]}</Badge>
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
