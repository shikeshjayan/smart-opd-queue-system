import type { ConnectionStatus as ConnectionStatusValue } from "@/features/realtime/types/realtime.types";

const labels: Record<ConnectionStatusValue, string> = {
  connecting: "Connecting…",
  connected: "Live",
  reconnecting: "Reconnecting…",
  disconnected: "Offline",
};

const dotClasses: Record<ConnectionStatusValue, string> = {
  connecting: "bg-ink-300",
  connected: "bg-status-success",
  reconnecting: "bg-status-warning",
  disconnected: "bg-status-danger",
};

type ConnectionStatusProps = {
  status: ConnectionStatusValue;
  className?: string;
};

export function ConnectionStatus({ status, className = "" }: ConnectionStatusProps) {
  const label = labels[status];
  return (
    <span
      role="status"
      aria-live="polite"
      className={`inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-surface px-3 py-1 text-xs font-medium text-ink-700 ${className}`}
    >
      <span className={`h-2 w-2 rounded-full ${dotClasses[status]}`} aria-hidden="true" />
      {label}
    </span>
  );
}
