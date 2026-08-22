"use client";

import { useDistrictAdmin } from "@/features/auth/context";
import { useDistrictHospitals } from "@/features/district-admin/hooks/useDistrictAdminData";
import { PageHeader } from "@/features/hospital-admin/components/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";
import { useState, useEffect } from "react";
import { listDepartments } from "@/services/data";

export default function DistrictAdminDepartmentsPage() {
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

  const [departmentsByHospital, setDepartmentsByHospital] = useState<Map<string, string[]>>(new Map());

  useEffect(() => {
    const deptMap = new Map<string, string[]>();
    hospitals.forEach((h) => {
      const deptNames = listDepartments(h.id).map((d) => d.name);
      deptMap.set(h.id, deptNames);
    });
    setDepartmentsByHospital(deptMap);
  }, [hospitals]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`District Departments - ${admin?.name ?? "District Admin"}`}
        description="Manage department configurations across hospitals"
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {hospitals.map((hospital) => (
          <div
            key={hospital.id}
            className="rounded-card border border-ink-200 p-4 shadow-card hover:shadow-lg transition-shadow"
          >
            <h3 className="font-medium text-ink-900 mb-3">{hospital.name}</h3>
            <div className="space-y-2">
              {departmentsByHospital.get(hospital.id)?.map((deptName, i) => (
                <div
                  key={i}
                  className="text-sm text-ink-700 flex items-center gap-2"
                >
                  {deptName}
                </div>
              ))}
              {!departmentsByHospital.get(hospital.id)?.length && (
                <p className="text-xs text-ink-400">No departments</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}