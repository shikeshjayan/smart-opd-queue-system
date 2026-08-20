import { formatWait, formatWaitRange } from "../utils/waiting-time";

type WaitingTimeProps = {
  minutes: number | null;
};

export function WaitingTime({ minutes }: WaitingTimeProps) {
  return (
    <div className="rounded-card border border-ink-200 bg-surface p-4 text-center shadow-card">
      <p className="text-xs text-ink-500">Estimated Waiting</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-ink-900">
        {minutes != null ? formatWait(minutes) : "—"}
      </p>
      {minutes != null && (
        <p className="mt-0.5 text-xs text-ink-500">Approx {formatWaitRange(minutes)}</p>
      )}
    </div>
  );
}
