import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { PatientEncounter } from "../types/medical-record.types";
import { formatDate, visitTypeLabel } from "../utils/format";

export function EncounterCard({ encounter, href }: {
  encounter: PatientEncounter;
  href: string;
}) {
  return (
    <li className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-ink-900">{formatDate(encounter.date)}</p>
          <p className="mt-0.5 text-sm text-ink-700">{encounter.departmentName}</p>
          <p className="text-sm text-ink-500">{encounter.hospitalName}</p>
          <p className="mt-1.5 text-xs text-ink-500">{encounter.doctorName}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge variant="info">{visitTypeLabel(encounter.visitType)}</Badge>
          <Link
            href={href}
            className="rounded-btn border border-brand-600 px-3 py-1.5 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-brand-600"
          >
            View Details
          </Link>
        </div>
      </div>
    </li>
  );
}