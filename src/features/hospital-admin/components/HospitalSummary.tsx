import type { Hospital } from "@/types";
import { Badge } from "@/components/ui/badge";
import { getDistrictName } from "@/config/districts";

type HospitalSummaryProps = {
  hospital: Hospital;
};

export function HospitalSummary({ hospital }: HospitalSummaryProps) {
  return (
    <section
      aria-labelledby="hospital-summary-title"
      className="rounded-card border border-ink-200 bg-surface p-5 shadow-card"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 id="hospital-summary-title" className="text-2xl font-bold text-ink-900">
            {hospital.name}
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            {getDistrictName(hospital.districtId)} · {hospital.address}
          </p>
          <p className="mt-0.5 text-sm text-ink-500">Phone: {hospital.phone}</p>
        </div>
        <Badge variant={hospital.status === "active" ? "success" : "danger"}>
          {hospital.status === "active" ? "Active" : "Inactive"}
        </Badge>
      </div>
    </section>
  );
}
