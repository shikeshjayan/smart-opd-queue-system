import React from "react";
import { useDistrictAdmin } from "@/features/auth/context";
import { useDistrictHospitals } from "@/features/district-admin/hooks/useDistrictAdminData";
import { listServices } from "@/services/hospital-ops";
import { ServiceAvailabilityRow } from "@/services/district/types";

export interface ServiceListProps {
  hospitals: typeof import("@/services/data").Hospital[];
  onSelect?: (hospitalId: string) => void;
}

export const ServiceList: React.FC<ServiceListProps> = ({ hospitals, onSelect }) => {
  const { admin } = useDistrictAdmin();

  const [selectedHospital, setSelectedHospital] = React.useState<string | null>(null);
  const [services, setServices] = React.useState<ServiceAvailabilityRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (selectedHospital) {
      setIsLoading(true);
      listServices(selectedHospital).then((result) => {
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
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.Cell>Service</Table.Cell>
                  <Table.Cell className="text-right">Code</Table.Cell>
                  <Table.Cell>Status</Table.Cell>
                  <Table.Cell className="text-right">Hospitals</Table.Cell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {services.map((svc) => (
                  <Table.Key row>
                    <Table.Cell>{svc.serviceName}</Table.Cell>
                    <Table.Cell className="text-right text-ink-500">{svc.code}</Table.Cell>
                    <Table.Cell>
                      {svc.status === "active" ? (
                        <span className="text-green-600">Active</span>
                      ) : (
                        <span className="text-red-600">Inactive</span>
                      )}
                    </Table.Cell>
                    <Table.Cell className="text-right">{svc.providerHospitalIds.length}</Table.Cell>
                  </Table.Key>
                ))}
              </Table.Body>
            </Table>
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