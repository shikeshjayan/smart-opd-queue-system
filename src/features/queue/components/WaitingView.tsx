import type { QueueSnapshot } from "../types/queue.types";
import { ConnectionStatus } from "./ConnectionStatus";
import { NotificationHint } from "./NotificationHint";
import { QueuePosition } from "./QueuePosition";
import { QueueProgress } from "./QueueProgress";
import { QueueStatusBadge } from "./QueueStatusBadge";
import { WaitingTime } from "./WaitingTime";

type WaitingViewProps = {
  snapshot: QueueSnapshot;
  connection: "connecting" | "connected" | "reconnecting" | "disconnected";
};

export function WaitingView({ snapshot, connection }: WaitingViewProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-ink-900">Your OPD Queue</h1>
        <ConnectionStatus status={connection} />
      </div>

      <div
        aria-label={`Your token is ${snapshot.tokenNumber}`}
        className="rounded-card bg-brand-700 p-6 text-center text-white shadow-token"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-100">Your Token</p>
        <p className="mt-2 text-6xl font-bold tracking-tight">{snapshot.tokenNumber}</p>
        <p className="mt-1 text-sm text-brand-100">{snapshot.opdName}</p>
        <div className="mt-3 flex justify-center">
          <QueueStatusBadge status={snapshot.status} />
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
        <div className="rounded-card border border-ink-200 bg-surface p-3 shadow-card">
          <dt className="text-xs text-ink-500">Now Serving</dt>
          <dd className="mt-1 text-xl font-semibold text-ink-900">
            {snapshot.nowServing ?? "—"}
          </dd>
        </div>
        <QueuePosition position={snapshot.patientsAhead + 1} />
        <div className="rounded-card border border-ink-200 bg-surface p-3 shadow-card">
          <dt className="text-xs text-ink-500">Patients Ahead</dt>
          <dd className="mt-1 text-xl font-semibold text-ink-900">{snapshot.patientsAhead}</dd>
        </div>
        <WaitingTime minutes={snapshot.estimatedWaitMinutes} />
      </dl>

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

      <NotificationHint />
    </div>
  );
}
