import type { OPDCounts } from "@/types";

type DoctorStatsProps = {
  counts: OPDCounts;
};

export function DoctorStats({ counts }: DoctorStatsProps) {
  const stats = [
    { id: "patients", label: "Patients", value: counts.total },
    { id: "waiting", label: "Waiting", value: counts.waiting },
    { id: "completed", label: "Completed", value: counts.completed },
  ];

  return (
    <section aria-labelledby="doctor-stats-title">
      <h2 id="doctor-stats-title" className="sr-only">
        Today&apos;s OPD Statistics
      </h2>
      <dl className="grid grid-cols-3 gap-3">
        {stats.map((stat) => (
          <div key={stat.id} className="rounded-card border border-ink-200 bg-surface p-4 text-center shadow-card">
            <dt className="text-xs text-ink-500">{stat.label}</dt>
            <dd className="mt-1 text-3xl font-bold text-ink-900">{stat.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
