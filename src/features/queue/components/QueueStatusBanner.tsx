import type { QueueOperationalState } from "../utils/queue-status";

const config: Record<
  QueueOperationalState,
  { label: (opdName?: string) => string; dot: string; classes: string }
> = {
  normal: {
    label: (opdName) => `${opdName ?? "This OPD"} is running normally`,
    dot: "bg-status-success",
    classes: "border-status-success-soft bg-status-success-soft text-status-success",
  },
  paused: {
    label: (opdName) => `${opdName ?? "This OPD"} is temporarily paused`,
    dot: "bg-status-warning",
    classes: "border-status-warning-soft bg-status-warning-soft text-status-warning",
  },
  closed: {
    label: (opdName) => `${opdName ?? "This OPD"} is closed`,
    dot: "bg-status-danger",
    classes: "border-status-danger-soft bg-status-danger-soft text-status-danger",
  },
  delayed: {
    label: (opdName) => `${opdName ?? "This OPD"} is experiencing delays`,
    dot: "bg-status-warning",
    classes: "border-status-warning-soft bg-status-warning-soft text-status-warning",
  },
};

type QueueStatusBannerProps = {
  state: QueueOperationalState;
  opdName?: string;
  reason?: string;
  updatedAt?: string;
};

export function QueueStatusBanner({ state, opdName, reason, updatedAt }: QueueStatusBannerProps) {
  const { label, dot, classes } = config[state];
  return (
    <div
      role="status"
      className={`flex flex-wrap items-center gap-x-3 gap-y-1 rounded-card border px-4 py-3 text-sm ${classes}`}
    >
      <span className={`h-2.5 w-2.5 rounded-full ${dot}`} aria-hidden="true" />
      <p className="font-medium">{label(opdName)}</p>
      {reason && <p className="text-sm opacity-90">{reason}</p>}
      {updatedAt && (
        <p className="text-xs opacity-80">
          Last updated: {new Date(updatedAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}
        </p>
      )}
    </div>
  );
}
