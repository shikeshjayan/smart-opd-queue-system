import type { AppointmentWithToken } from "@/services/appointments/types";

export function CheckInResult({ result }: { result: AppointmentWithToken }) {
  return (
    <div className="rounded-card border border-ink-200 bg-surface p-6 text-center shadow-card">
      <span
        aria-hidden="true"
        className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-status-success-soft text-2xl text-status-success"
      >
        ✓
      </span>
      <h2 className="mt-3 text-2xl font-bold text-ink-900">Checked in</h2>
      <p className="mt-1 text-sm text-ink-500">
        {result.token.departmentName} · {result.token.opdName}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-card border border-ink-200 bg-ink-50 p-4">
          <p className="text-xs uppercase tracking-wide text-ink-500">Token</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-brand-700">
            {result.token.tokenNumber}
          </p>
        </div>
        <div className="rounded-card border border-ink-200 bg-ink-50 p-4">
          <p className="text-xs uppercase tracking-wide text-ink-500">Queue position</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-ink-900">
            {result.token.queuePosition}
          </p>
        </div>
      </div>
    </div>
  );
}