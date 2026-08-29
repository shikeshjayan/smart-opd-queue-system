import Link from "next/link";
import type { TokenBundle } from "@/types";
import { formatWait, formatWaitRange } from "../utils/format";

type ActiveTokenCardProps = {
  bundle: TokenBundle;
};

export function ActiveTokenCard({ bundle }: ActiveTokenCardProps) {
  const { hospital, department, opd, token } = bundle;
  const wait = token.estimatedWaitMinutes ?? opd.estimatedWaitMinutes;

  return (
    <section
      aria-labelledby="active-token-title"
      className="rounded-card bg-brand-700 p-5 text-white shadow-token sm:p-6"
    >
      <p id="active-token-title" className="text-xs font-semibold uppercase tracking-wide text-brand-100">
        Your Active Token
      </p>
      <p className="mt-1 text-sm text-brand-100">
        {hospital.name}, {hospital.districtId}
      </p>

      <p className="mt-4 text-6xl font-bold tracking-tight" aria-label={`Token ${token.tokenNumber}`}>
        {token.tokenNumber}
      </p>
      <p className="mt-1 text-sm text-brand-100">
        {department.name} &middot; {opd.name}
      </p>

      <dl className="mt-6 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-token bg-brand-800/60 p-3">
          <dt className="text-xs text-brand-100">Now Serving</dt>
          <dd className="mt-1 text-lg font-semibold">{opd.currentlyServing ?? "—"}</dd>
        </div>
        <div className="rounded-token bg-brand-800/60 p-3">
          <dt className="text-xs text-brand-100">Patients Ahead</dt>
          <dd className="mt-1 text-lg font-semibold">{token.patientsAhead}</dd>
        </div>
        <div className="rounded-token bg-brand-800/60 p-3">
          <dt className="text-xs text-brand-100">Est. Wait</dt>
          <dd className="mt-1 text-lg font-semibold">{wait != null ? formatWait(wait) : "—"}</dd>
        </div>
      </dl>

      <p className="mt-3 text-center text-xs text-brand-100">
        Approximate wait: {wait != null ? formatWaitRange(wait) : "please check the queue"}
      </p>

      <Link
        href="/patient/queue"
        className="mt-5 flex h-11 w-full items-center justify-center rounded-btn bg-white font-medium text-brand-700 transition-colors hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        View Queue
      </Link>
    </section>
  );
}
