import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { PatientEncounter } from "../types/medical-record.types";
import { formatDate, visitTypeLabel } from "../utils/format";

type MedicalTimelineProps = {
  encounters: PatientEncounter[];
  detailHref: (encounterId: string) => string;
};

export function MedicalTimeline({ encounters, detailHref }: MedicalTimelineProps) {
  const years = [...new Set(encounters.map((e) => e.date.slice(0, 4)))].sort(
    (a, b) => b.localeCompare(a)
  );

  return (
    <div className="flex flex-col gap-8">
      {years.map((year) => (
        <section key={year} aria-label={`${year} visits`}>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-500">{year}</h3>
          <ol className="mt-3 space-y-3 border-l border-ink-200 pl-4">
            {encounters
              .filter((e) => e.date.slice(0, 4) === year)
              .map((encounter) => (
                <li key={encounter.id} className="relative">
                  <span
                    className="absolute -left-[21px] top-2 h-2.5 w-2.5 rounded-full bg-brand-600"
                    aria-hidden="true"
                  />
                  <div className="flex flex-wrap items-start justify-between gap-2 rounded-card border border-ink-200 bg-surface p-4 shadow-card">
                    <div>
                      <p className="font-semibold text-ink-900">{formatDate(encounter.date)}</p>
                      <p className="text-sm text-ink-700">{encounter.departmentName}</p>
                      <p className="text-sm text-ink-500">{encounter.hospitalName}</p>
                      <p className="mt-1 text-xs text-ink-500">{encounter.doctorName}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant="info">{visitTypeLabel(encounter.visitType)}</Badge>
                      <Link
                        href={detailHref(encounter.id)}
                        className="rounded-btn border border-brand-600 px-3 py-1.5 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-brand-600"
                      >
                        Open
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
          </ol>
        </section>
      ))}
    </div>
  );
}