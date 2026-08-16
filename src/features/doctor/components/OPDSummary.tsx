import Link from "next/link";
import type { OPD } from "@/types";
import { formatTime } from "@/features/patient/utils/format";
import { OpdStatusBadge } from "@/features/opd/components/OpdStatusBadge";

type OPDSummaryProps = {
  opd: OPD;
  doctorName: string;
  counts: {
    total: number;
    completed: number;
    waiting: number;
    skipped: number;
  };
};

export function OPDSummary({ opd, doctorName, counts }: OPDSummaryProps) {
  const items = [
    { id: "total", label: "Total tokens", value: counts.total },
    { id: "completed", label: "Completed", value: counts.completed },
    { id: "waiting", label: "Waiting", value: counts.waiting },
    { id: "skipped", label: "Skipped", value: counts.skipped },
  ];

  return (
    <section aria-labelledby="opd-summary-title" className="rounded-card border border-ink-200 bg-surface p-5 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 id="opd-summary-title" className="text-lg font-semibold text-ink-900">
            Today&apos;s OPD
          </h2>
          <p className="mt-0.5 text-sm text-ink-500">
            {opd.name} &middot; {formatTime(opd.startTime)} – {formatTime(opd.endTime)}
          </p>
          <p className="mt-0.5 text-sm text-ink-500">Doctor: {doctorName}</p>
        </div>
        <OpdStatusBadge status={opd.status} />
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {items.map((item) => (
          <div key={item.id} className="rounded-token bg-surface-muted p-3 text-center">
            <dt className="text-xs text-ink-500">{item.label}</dt>
            <dd className="mt-1 text-xl font-semibold text-ink-900">{item.value}</dd>
          </div>
        ))}
      </dl>

      <Link
        href="/doctor/queue"
        className="mt-4 inline-flex h-10 items-center rounded-btn border border-brand-600 px-4 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-brand-600"
      >
        Open Queue
      </Link>
    </section>
  );
}
