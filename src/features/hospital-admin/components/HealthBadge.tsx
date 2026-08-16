import type { QueueHealth } from "@/types";
import { Badge } from "@/components/ui/badge";
import { HEALTH_LABELS, HEALTH_VARIANTS } from "../utils/queue-health";

type HealthBadgeProps = {
  health: QueueHealth;
};

export function HealthBadge({ health }: HealthBadgeProps) {
  return (
    <Badge variant={HEALTH_VARIANTS[health]}>
      <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {HEALTH_LABELS[health]}
    </Badge>
  );
}
