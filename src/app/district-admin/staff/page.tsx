"use client";

import { useDistrictAdmin } from "@/features/auth/context";
import { useDistrictResources } from "@/features/district-admin/hooks/useDistrictAdminData";
import { PageHeader } from "@/features/hospital-admin/components/PageHeader";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";

export default function DistrictAdminStaffPage() {
  const { admin, districtId } = useDistrictAdmin();
  const { data: resources, isLoading, error, reload } = useDistrictResources(districtId ?? "ernakulam");

  if (isLoading || !districtId) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-9 w-2/3" />
        <Skeleton className="h-28 w-full" />
      </div>
    );
  }

  if (error || !resources) {
    return <ErrorState message={error ?? "Unable to load staff data."} onRetry={reload} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Staff Management - ${admin?.name ?? "District Admin"}`}
        description="View and manage hospital staff across the district"
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Hospital</TableHead>
            <TableHead className="text-right">Doctors</TableHead>
            <TableHead className="text-right">Nurses</TableHead>
            <TableHead className="text-right">Lab Staff</TableHead>
            <TableHead className="text-right">Pharmacy</TableHead>
            <TableHead className="text-right">Other</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {resources.map((r) => (
            <TableRow key={r.hospitalId}>
              <TableCell className="font-medium text-ink-900">{r.hospitalName}</TableCell>
              <TableCell className="text-right">{r.doctorsAvailable}/{r.doctorsTotal}</TableCell>
              <TableCell className="text-right">{r.nurses}</TableCell>
              <TableCell className="text-right">{r.labStaff}</TableCell>
              <TableCell className="text-right">{r.pharmacyStaff}</TableCell>
              <TableCell className="text-right">{r.otherStaff}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
