import { Badge } from "@/components/ui/badge";
import type { OPDStatus } from "@/types";

const config: Record<OPDStatus, { label: string; variant: "success" | "danger" | "warning" | "info" }> = {
  open: { label: "Available", variant: "success" },
  closed: { label: "Closed", variant: "danger" },
  full: { label: "Tokens Full", variant: "warning" },
  unavailable: { label: "Doctor Unavailable", variant: "info" },
};

type OpdStatusBadgeProps = {
  status: OPDStatus;
};

export function OpdStatusBadge({ status }: OpdStatusBadgeProps) {
  const { label, variant } = config[status];
  return (
    <Badge variant={variant}>
      <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      <span>Status: {label}</span>
    </Badge>
  );
}
