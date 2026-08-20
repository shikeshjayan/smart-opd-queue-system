import type { QueueSnapshot } from "../types/queue.types";
import { ConnectionStatus } from "./ConnectionStatus";

type CompletedViewProps = {
  snapshot: QueueSnapshot;
  connection: "connecting" | "connected" | "reconnecting" | "disconnected";
};

export function CompletedView({ snapshot, connection }: CompletedViewProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-ink-900">Your OPD Queue</h1>
        <ConnectionStatus status={connection} />
      </div>

      <div className="rounded-card border border-status-success-soft bg-status-success-soft p-6 text-center shadow-card">
        <p className="text-lg font-semibold text-status-success">Consultation completed</p>
        <p className="mt-2 text-5xl font-bold tabular-nums text-ink-900">{snapshot.tokenNumber}</p>
        <p className="mt-1 text-sm text-ink-500">{snapshot.opdName}</p>
        <p className="mt-4 text-sm text-status-success/90">
          Your consultation is complete. Thank you for visiting.
        </p>
      </div>
    </div>
  );
}
