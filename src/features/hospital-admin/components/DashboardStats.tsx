import type { HospitalStats } from "@/services/admin/types";

type DashboardStatsProps = {
  stats: HospitalStats;
};

const statItems: Array<{
  id: keyof HospitalStats;
  label: string;
  highlight?: boolean;
}> = [
  { id: "departments", label: "Departments" },
  { id: "opds", label: "OPD Sessions" },
  { id: "doctors", label: "Doctors" },
  { id: "staff", label: "Staff" },
  { id: "patients", label: "Registered Patients" },
  { id: "tokensToday", label: "Tokens Today", highlight: true },
  { id: "waiting", label: "Waiting Now", highlight: true },
  { id: "completed", label: "Completed Today", highlight: true },
];

export function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <section aria-labelledby="dashboard-stats-title">
      <h2 id="dashboard-stats-title" className="sr-only">
        Hospital statistics
      </h2>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statItems.map((item) => (
          <div
            key={item.id}
            className={`rounded-card border p-4 shadow-card ${
              item.highlight
                ? "border-brand-200 bg-brand-50"
                : "border-ink-200 bg-surface"
            }`}
          >
            <dt className="text-xs text-ink-500">{item.label}</dt>
            <dd
              className={`mt-1 text-2xl font-bold ${
                item.highlight ? "text-brand-700" : "text-ink-900"
              }`}
            >
              {stats[item.id]}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
