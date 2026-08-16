import type { PatientStat } from "../types/patient.types";

type PatientStatsProps = {
  stats: PatientStat[];
};

export function PatientStats({ stats }: PatientStatsProps) {
  return (
    <section aria-labelledby="patient-stats-title">
      <h2 id="patient-stats-title" className="sr-only">
        Patient Statistics
      </h2>
      <dl className="grid grid-cols-3 gap-3">
        {stats.map((stat) => (
          <div key={stat.id} className="rounded-card border border-ink-200 bg-surface p-3 text-center shadow-card">
            <dt className="text-xs text-ink-500">{stat.label}</dt>
            <dd className="mt-1 text-xl font-semibold text-ink-900">{stat.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
