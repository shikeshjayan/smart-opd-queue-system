"use client";

import { useDistrictAdmin } from "@/features/auth/context";
import { useDistrictHospitals } from "@/features/district-admin/hooks/useDistrictAdminData";
import { PageHeader } from "@/features/hospital-admin/components/PageHeader";
import { StatsCard } from "@/features/government-admin/components/StatsCard";
import { Table } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";
import { useState, useEffect } from "react";
import { listStaffByHospital } from "@/services/data";

export default function DistrictAdminStaffPage() {
  const { admin, districtId } = useDistrictAdmin();
  const { data: hospitals, isLoading, error } = useDistrictHospitals(districtId ?? "ernakulam");

  if (isLoading || !districtId) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-9 w-2/3" />
        <Skeleton className="h-28 w-full" />
      </div>
    );
  }

  if (error || !hospitals) {
    return <ErrorState message={error ?? "Unable to load hospitals."} onRetry={() => { }} />;
  }

  const [staffData, setStaffData] = useState<Map<string, any[]>>(new Map());
  const [isLoadingStaff, setIsLoadingStaff] = useState(true);

  useEffect(() => {
    const loadStaff = async () => {
      setIsLoadingStaff(true);
      const map = new Map<string, any[]>();
      for (const hospital of hospitals) {
        const staff = listStaffByHospital(hospital.id).filter((s) => s.status === "active");
        map.set(hospital.id, staff);
      }
      setStaffData(map);
      setIsLoadingStaff(false);
    };
    loadStaff();
  }, [hospitals]);

  if (isLoadingStaff) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-9 w-2/3" />
        <Skeleton className="h-28 w-full" />
      </div>
    );
  }

  const staffRows: Array<{ name: string; role: string; hospitalName: string; status: string }> = [];
  hospitals.forEach((h) => {
    const staff = staffData.get(h.id) || [];
    staff.forEach((s) => {
      staffRows.push({
        name: s.name,
        role: s.role,
        hospitalName: h.name,
        status: s.status,
      });
    });
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Staff Management - ${admin?.name ?? "District Admin"}`}
        description="View and manage hospital staff across the district"
      />

      <Table>
        <Table.Header>
          <Table.Row>
            <Table.Cell>Name</Table.Cell>
            <Table.Cell>Role</Table.Cell>
            <Table.Cell>Hospital</Table.Cell>
            <Table.Cell className="text-right">Status</Table.Cell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {staffRows.map((row) => (
            <Table.Key row>
              <Table.Cell>{row.name}</Table.Cell>
              <Table.Cell>{row.role}</Table.Cell>
              <Table.Cell>{row.hospitalName}</Table.Cell>
              <Table.Cell className="text-right">
                {row.status === "active" ? (
                  <span className="text-green-600">Active</span>
                ) : (
                  <span className="text-red-600">Inactive</span>
                )}
              </Table.Cell>
            </Table.Key>
          ))}
        </Table.Body>
      </Table>
    </div>
  );
}