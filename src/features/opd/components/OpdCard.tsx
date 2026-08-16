import Link from "next/link";
import type { OPD } from "@/types";
import { formatTime, formatWait } from "@/features/patient/utils/format";
import { OpdStatusBadge } from "./OpdStatusBadge";

type OpdCardProps = {
  opd: OPD;
  departmentName: string;
};

export function OpdCard({ opd, departmentName }: OpdCardProps) {
  const canBook = opd.status === "open";
  const wait = opd.estimatedWaitMinutes;

  return (
    <article className="flex flex-col gap-3 rounded-card border border-ink-200 bg-surface p-4 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-ink-900">{opd.name}</h3>
          <p className="mt-0.5 text-sm text-ink-500">
            {formatTime(opd.startTime)} – {formatTime(opd.endTime)}
          </p>
        </div>
        <OpdStatusBadge status={opd.status} />
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-xs text-ink-500">Currently Serving</dt>
          <dd className="mt-0.5 font-medium text-ink-900">{opd.currentlyServing ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-500">Estimated Waiting</dt>
          <dd className="mt-0.5 font-medium text-ink-900">{wait != null ? formatWait(wait) : "—"}</dd>
        </div>
      </dl>

      <p className="text-sm text-ink-500">{departmentName}</p>

      <Link
        href={canBook ? `/patient/token?opd=${opd.id}` : "#"}
        aria-disabled={!canBook}
        tabIndex={canBook ? 0 : -1}
        className={`flex h-11 items-center justify-center rounded-btn font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ${
          canBook
            ? "bg-brand-600 text-white hover:bg-brand-700"
            : "pointer-events-none bg-ink-100 text-ink-400"
        }`}
      >
        Get Token
      </Link>
    </article>
  );
}
