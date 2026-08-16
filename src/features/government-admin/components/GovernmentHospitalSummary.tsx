import type { GovernmentHospitalDetail } from "@/services/government/types";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

type GovernmentHospitalSummaryProps = {
  detail: GovernmentHospitalDetail;
};

const statItems: Array<{ id: string; label: string; value: number }> = [
  { id: "departments", label: "Departments", value: 0 },
  { id: "activeOpds", label: "Active OPDs", value: 0 },
  { id: "doctors", label: "Doctors", value: 0 },
];

export function GovernmentHospitalSummary({ detail }: GovernmentHospitalSummaryProps) {
  const { hospital, districtName, stats } = detail;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-ink-900">{hospital.name}</h2>
            <Badge variant={hospital.status === "active" ? "success" : "danger"}>
              {hospital.status === "active" ? "Active" : "Inactive"}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-ink-500">
            {districtName} District &middot; {hospital.address}
          </p>
          <p className="text-sm text-ink-500">{hospital.phone}</p>
        </div>
      </div>

      <Card>
        <h3 className="mb-3 font-semibold text-ink-900">Today&apos;s Overview</h3>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-card border border-ink-200 p-3">
            <dt className="text-xs text-ink-500">Patients</dt>
            <dd className="mt-1 text-2xl font-bold text-ink-900">
              {stats.opds.toLocaleString("en-IN")}
            </dd>
          </div>
          <div className="rounded-card border border-ink-200 p-3">
            <dt className="text-xs text-ink-500">Waiting</dt>
            <dd className="mt-1 text-2xl font-bold text-status-warning">
              {stats.waiting.toLocaleString("en-IN")}
            </dd>
          </div>
          <div className="rounded-card border border-ink-200 p-3">
            <dt className="text-xs text-ink-500">Completed</dt>
            <dd className="mt-1 text-2xl font-bold text-status-success">
              {stats.completed.toLocaleString("en-IN")}
            </dd>
          </div>
          <div className="rounded-card border border-ink-200 p-3">
            <dt className="text-xs text-ink-500">Cancelled</dt>
            <dd className="mt-1 text-2xl font-bold text-ink-900">0</dd>
          </div>
        </dl>
      </Card>

      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {statItems.map((item) => (
          <div key={item.id} className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
            <dt className="text-xs text-ink-500">{item.label}</dt>
            <dd className="mt-1 text-2xl font-bold text-ink-900">
              {item.id === "departments"
                ? stats.departments
                : item.id === "activeOpds"
                  ? stats.opdsOpen
                  : stats.doctors}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
