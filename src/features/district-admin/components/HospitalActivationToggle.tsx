import React from "react";
import { useDistrictAdmin } from "@/features/government-admin/district-context";
import { DistrictSettings } from "@/services/district/types";

export interface HospitalActivationToggleProps {
  districtId: string;
  onActivationChange: (
    districtId: string,
    status: "active" | "inactive",
    actor?: { id: string; name: string; role: string }
  ) => void;
  settings: DistrictSettings;
}

export const HospitalActivationToggle: React.FC<HospitalActivationToggleProps> = ({
  districtId,
  onActivationChange,
  settings,
}) => {
  const { admin } = useDistrictAdmin();
  const [activeHospitals, setActiveHospitals] = React.useState<string[]>([]);

  React.useEffect(() => {
    const activated = Object.entries(settings.hospitalActivationOverrides)
      .filter(([_, status]) => status === "active")
      .map(([id]) => id);
    setActiveHospitals(activated);
  }, [settings.hospitalActivationOverrides]);

  const handleToggle = (hospitalId: string) => {
    const newStatus = activeHospitals.includes(hospitalId) ? "inactive" : "active";
    onActivationChange(districtId, newStatus, {
      id: admin?.id ?? "dadm_001",
      name: admin?.name ?? "District Admin",
      role: "District Admin",
    });
    setActiveHospitals((prev) =>
      prev.includes(hospitalId)
        ? prev.filter((id) => id !== hospitalId)
        : [...prev, hospitalId]
    );
  };

  return (
    <div className="rounded-card border border-ink-200 p-6 shadow-card">
      <h3 className="font-medium text-ink-900 mb-4">Hospital Activation</h3>
      <p className="text-sm text-ink-500 mb-4">
        Toggle hospital activation status. Requires MANAGE_DISTRICT_SETTINGS permission.
      </p>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {[
          "hos_001",
          "hos_002",
          "hos_003",
          "hos_004",
          "hos_005",
          "hos_006",
          "hos_007",
        ].map((hospitalId) => {
          const hospital = {
            hos_001: "General Hospital",
            hos_002: "Coimbatore Medical",
            hos_003: "District Hospital",
            hos_004: "Taluk Hospital",
            hos_005: "Women & Children",
            hos_006: "City Hospital",
            hos_007: "Rural Hospital",
          }[hospitalId];

          const isActive = activeHospitals.includes(hospitalId);
          const override = settings.hospitalActivationOverrides?.[hospitalId];

          return (
            <div
              key={hospitalId}
              className="rounded-card border border-ink-200 p-3 shadow-card hover:bg-surface-muted"
              style={{ backgroundColor: isActive ? "bg-green-50" : "bg-white" }}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-ink-900">{hospital}</span>
                <span
                  className={isActive
                    ? "text-green-600 font-medium"
                    : "text-red-600 font-medium"}
                >
                  {isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <button
                onClick={() => handleToggle(hospitalId)}
                className="mt-2 w-full rounded bg-gray-100 px-3 py-1 text-xs text-ink-600 hover:bg-gray-200 focus-outline"
              >
                {isActive ? "Deactivate" : "Activate"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};