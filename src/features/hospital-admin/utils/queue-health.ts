import type { QueueHealth } from "@/types";

export const HEALTH_LABELS: Record<QueueHealth, string> = {
  healthy: "Healthy",
  warning: "High Wait",
  critical: "Critical",
};

export const HEALTH_VARIANTS: Record<
  QueueHealth,
  "success" | "warning" | "danger" | "default" | "info"
> = {
  healthy: "success",
  warning: "warning",
  critical: "danger",
};

export function describeHealth(health: QueueHealth): string {
  switch (health) {
    case "healthy":
      return "Queue is moving at a comfortable pace.";
    case "warning":
      return "Waiting list is building up. Consider opening more windows.";
    case "critical":
      return "Queue is overloaded. Immediate attention recommended.";
  }
}
