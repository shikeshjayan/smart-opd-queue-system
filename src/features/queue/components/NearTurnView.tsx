import type { QueueSnapshot } from "../types/queue.types";
import { ConnectionStatus } from "./ConnectionStatus";
import { QueueProgress } from "./QueueProgress";
import { WaitingTime } from "./WaitingTime";
import { formatWaitRange } from "../utils/waiting-time";

type NearTurnViewProps = {
  snapshot: QueueSnapshot;
  connection: "connecting" | "connected" | "reconnecting" | "disconnected";
};

export function NearTurnView({ snapshot, connection }: NearTurnViewProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-ink-900">Your OPD Queue</h1>
        <ConnectionStatus status={connection} />
      </div>

      <div
        role="alert"
        className="rounded-card border border-status-warning-soft bg-status-warning-soft p-5 shadow-card"
      >
        <p className="font-semibold text-status-warning">Your turn is approaching</p>
        <p className="mt-0.5 text-sm text-status-warning/90">
          Please stay nearby — {snapshot.patientsAhead} patient
          {snapshot.patientsAhead === 1 ? "" : "s"} ahead.
        </p>
      </div>

      <div className="rounded-card bg-brand-700 p-6 text-center text-white shadow-token">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-100">Your Token</p>
        <p className="mt-2 text-6xl font-bold tracking-tight">{snapshot.tokenNumber}</p>
        <p className="mt-1 text-sm text-brand-100">{snapshot.opdName}</p>
      </div>

      <dl className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-card border border-ink-200 bg-surface p-3 shadow-card">
          <dt className="text-xs text-ink-500">Now Serving</dt>
          <dd className="mt-1 text-xl font-semibold text-ink-900">
            {snapshot.nowServing ?? "—"}
          </dd>
        </div>
        <div className="rounded-card border border-ink-200 bg-surface p-3 shadow-card">
          <dt className="text-xs text-ink-500">Patients Ahead</dt>
          <dd className="mt-1 text-xl font-semibold text-ink-900">{snapshot.patientsAhead}</dd>
        </div>
        <WaitingTime minutes={snapshot.estimatedWaitMinutes} />
      </dl>

      {snapshot.estimatedWaitMinutes != null && (
        <p className="text-center text-sm text-ink-500">
          Estimated wait: approximately {formatWaitRange(snapshot.estimatedWaitMinutes)}
        </p>
      )}

      <section aria-labelledby="queue-progress-title">
        <h2 id="queue-progress-title" className="mb-3 text-lg font-semibold text-ink-900">
          Queue Progress
        </h2>
        {snapshot.entries.length > 0 ? (
          <QueueProgress entries={snapshot.entries} nowServing={snapshot.nowServing} />
        ) : (
          <p className="text-sm text-ink-500">No queue data available for this OPD.</p>
        )}
      </section>
    </div>
  );
}
