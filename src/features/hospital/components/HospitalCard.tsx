import Link from "next/link";
import type { Hospital } from "@/types";
import { getDistrictName } from "@/config/districts";
import { Badge } from "@/components/ui/badge";

type HospitalCardProps = {
  hospital: Hospital;
};

export function HospitalCard({ hospital }: HospitalCardProps) {
  return (
    <article className="flex flex-col gap-3 rounded-card border border-ink-200 bg-surface p-4 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-ink-900">{hospital.name}</h3>
          <p className="mt-0.5 text-sm text-ink-500">
            {getDistrictName(hospital.districtId)} &middot; {hospital.address}
          </p>
        </div>
        <Badge variant={hospital.status === "active" ? "success" : "danger"}>
          {hospital.status === "active" ? "Open" : "Closed"}
        </Badge>
      </div>

      <p className="text-sm text-ink-700">{hospital.opdCount} OPDs available</p>

      <Link
        href={`/patient/departments?hospital=${hospital.id}`}
        className="flex h-11 items-center justify-center rounded-btn bg-brand-600 font-medium text-white transition-colors hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
      >
        View Departments
      </Link>
    </article>
  );
}
