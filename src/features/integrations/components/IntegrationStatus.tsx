"use client";

import type { IntegrationStatus } from "@/integrations/types";
import { Badge } from "@/components/ui/badge";

const STATUS_VARIANT: Record<IntegrationStatus, "success" | "warning" | "danger" | "default"> = {
  healthy: "success",
  degraded: "warning",
  down: "danger",
  disconnected: "default",
};

const STATUS_LABEL: Record<IntegrationStatus, string> = {
  healthy: "Connected",
  degraded: "Degraded",
  down: "Down",
  disconnected: "Disconnected",
};

type IntegrationStatusBadgeProps = {
  status: IntegrationStatus;
};

export function IntegrationStatusBadge({ status }: IntegrationStatusBadgeProps) {
  return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>;
}
