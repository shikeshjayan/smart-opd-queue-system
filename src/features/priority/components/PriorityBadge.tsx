import type { QueuePriority } from "@/types";

const config: Record<QueuePriority, { label: string; fullLabel: string; dot: string; classes: string }> = {
  emergency: {
    label: "EMERGENCY",
    fullLabel: "Emergency",
    dot: "bg-status-danger",
    classes: "bg-status-danger-soft text-status-danger",
  },
  priority: {
    label: "PRIORITY",
    fullLabel: "Priority",
    dot: "bg-status-warning",
    classes: "bg-status-warning-soft text-status-warning",
  },
  normal: {
    label: "NORMAL",
    fullLabel: "Normal",
    dot: "bg-ink-400",
    classes: "bg-ink-100 text-ink-700",
  },
};

type PriorityBadgeProps = {
  priority: QueuePriority;
};

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const { label, fullLabel, dot, classes } = config[priority];
  return (
    <span
      role="img"
      aria-label={`${fullLabel} priority`}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${classes}`}
    >
      <span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden="true" />
      {label}
    </span>
  );
}
