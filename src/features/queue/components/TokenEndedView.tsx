import type { QueueSnapshot } from "../types/queue.types";
import { ConnectionStatus } from "./ConnectionStatus";
import { QueueStatusBadge } from "./QueueStatusBadge";

const messages: Record<string, string> = {
  skipped: "Your token was skipped. Please check with the reception desk.",
  cancelled: "Your token has been cancelled.",
  no_show: "Your token was marked as no-show. Please check with the reception desk.",
  expired: "Your token has expired.",
};

type TokenEndedViewProps = {
  snapshot: QueueSnapshot;
  connection: "connecting" | "connected" | "reconnecting" | "disconnected";
};

export function TokenEndedView({ snapshot, connection }: TokenEndedViewProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-ink-900">Your OPD Queue</h1>
        <ConnectionStatus status={connection} />
      </div>

      <div className="rounded-card border border-ink-200 bg-surface p-6 text-center shadow-card">
        <div className="flex justify-center">
          <QueueStatusBadge status={snapshot.status} />
        </div>
        <p className="mt-3 text-5xl font-bold tabular-nums text-ink-900">{snapshot.tokenNumber}</p>
        <p className="mt-1 text-sm text-ink-500">{snapshot.opdName}</p>
        <p className="mt-4 text-sm text-ink-700">{messages[snapshot.status] ?? "Your token is no longer active."}</p>
      </div>
    </div>
  );
}
