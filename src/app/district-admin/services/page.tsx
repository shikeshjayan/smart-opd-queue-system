"use client";

import { useDistrictAdmin } from "@/features/auth/context";
import { useDistrictHospitals } from "@/features/district-admin/hooks/useDistrictAdminData";
import { PageHeader } from "@/features/hospital-admin/components/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";
import { useState, useEffect } from "react";
import { hospitalOpsService } from "@/services/hospital-ops";
import type { DistrictHospitalRow } from "@/features/district-admin/types/district-admin.types";

export default function DistrictAdminServicesPage() {
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

  const [selectedHospital, setSelectedHospital] = useState<string | null>(null);
  const [services, setServices] = useState<any[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);

  useEffect(() => {
    if (selectedHospital) {
      setIsLoadingServices(true);
      hospitalOpsService.listServices(selectedHospital).then((result: any[]) => {
        setServices(result);
        setIsLoadingServices(false);
      }).catch(() => {
        setServices([]);
        setIsLoadingServices(false);
      });
    } else {
      setServices([]);
    }
  }, [selectedHospital]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="District Services"
        description="Manage clinical services across hospitals"
        actions={
          <button
            onClick={() => setSelectedHospital(null)}
            className="text-sm font-medium text-brand-600 hover:underline"
          >
            Select Hospital
          </button>
        }
      />

      {selectedHospital && (
        <div>
          <p className="text-sm text-ink-500">
            Hospital: <span className="font-medium">{hospitals.find((h: DistrictHospitalRow) => h.hospitalId === selectedHospital)?.name ?? selectedHospital}</span>
          </p>
          {isLoadingServices ? (
            <Skeleton className="h-10 w-full mb-3" />
          ) : services.length === 0 ? (
            <p className="text-sm text-ink-400">No active services</p>
          ) : (
            <div>
              <h4 className="font-medium text-ink-900 mb-2">Services</h4>
              {services.map((svc: any, i: number) => (
                <div
                  key={i}
                  className="text-sm text-ink-700 flex items-center gap-2 py-1 border-b border-ink-100 last:mb-0"
                >
                  <span>{svc.name ?? svc.serviceName ?? "Unknown"}</span>
                  <span className="text-xs text-ink-400">{svc.code ?? ""}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div>
        <h3 className="font-medium text-ink-900">Hospitals</h3>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
          {hospitals.map((hospital: DistrictHospitalRow) => (
            <div
              key={hospital.hospitalId}
              onClick={() => setSelectedHospital(hospital.hospitalId)}
              className="cursor-pointer rounded-card border border-ink-200 p-3 shadow-card hover:bg-surface-muted hover:transition-colors"
            >
              <div className="font-medium text-ink-900">{hospital.name}</div>
              <div className="text-xs text-ink-400">{hospital.hospitalId}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
