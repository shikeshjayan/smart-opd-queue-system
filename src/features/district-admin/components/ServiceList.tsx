import React from "react";
import { useDistrictAdmin } from "@/features/auth/context";
import { useDistrictHospitals } from "@/features/district-admin/hooks/useDistrictAdminData";
import { hospitalOpsService } from "@/services/hospital-ops";
import type { HospitalServiceEntry } from "@/services/hospital-ops/types";
import { PageHeader } from "@/features/hospital-admin/components/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";

export interface ServiceListProps {
  hospitals: any[];
  onSelect?: (hospitalId: string) => void;
}

export const ServiceList: React.FC<ServiceListProps> = ({ hospitals, onSelect }) => {
  const { admin } = useDistrictAdmin();

  const [selectedHospital, setSelectedHospital] = React.useState<string | null>(null);
  const [services, setServices] = React.useState<HospitalServiceEntry[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (selectedHospital) {
      setIsLoading(true);
      hospitalOpsService.listServices(selectedHospital).then((result) => {
        setServices(result);
        setIsLoading(false);
      });
    } else {
      setServices([]);
    }
  }, [selectedHospital]);

  return (
    <div className="space-y-4">
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
            Hospital: <span className="font-medium">{hospitals.find((h) => h.id === selectedHospital)?.name ?? selectedHospital}</span>
          </p>
          {isLoading ? (
            <Skeleton className="h-10 w-full mb-3" />
          ) : services.length === 0 ? (
            <p className="text-sm text-ink-400">No active services</p>
          ) : (
            <table className="min-w-full divide-y divide-ink-100">
              <thead>
                <tr>
                  <th className="text-left p-3 text-sm font-medium text-ink-500">Service</th>
                  <th className="text-right p-3 text-sm text-ink-500">Code</th>
                  <th className="text-right p-3 text-sm text-ink-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {services.map((svc) => (
                  <tr className="hover:bg-surface-muted">
                    <td className="p-3">{svc.name}</td>
                    <td className="text-right text-ink-500 p-3">{svc.code}</td>
                    <td className="text-right p-3">
                      {svc.status === "active" ? (
                        <span className="text-green-600">Active</span>
                      ) : (
                        <span className="text-red-600">Inactive</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <div>
        <h3 className="font-medium text-ink-900">Hospitals</h3>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
          {hospitals.map((hospital) => (
            <div
              key={hospital.id}
              onClick={() => onSelect?.(hospital.id)}
              onMouseOver={() => setSelectedHospital(hospital.id)}
              onMouseOut={() => setSelectedHospital(null)}
              className="cursor-pointer rounded-card border border-ink-200 p-3 shadow-card hover:bg-surface-muted hover:transition-colors"
            >
              <div className="font-medium text-ink-900">{hospital.name}</div>
              <div className="text-xs text-ink-400">{hospital.id}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};