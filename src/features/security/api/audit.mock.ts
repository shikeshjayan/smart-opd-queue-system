import { auditService } from "@/services/security";
import type { AuditEvent } from "@/types/security.types";

export type AuditFilters = {
  actor?: string;
  action?: string;
  result?: AuditEvent["result"] | "";
  dateFrom?: string;
  dateTo?: string;
};

const delay = () => new Promise((resolve) => setTimeout(resolve, 250));

export const auditMockApi = {
  async list(filters: AuditFilters): Promise<AuditEvent[]> {
    await delay();
    return auditService.query({
      query: filters.actor || undefined,
      action: filters.action || undefined,
      result: filters.result || undefined,
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined,
    });
  },
};

export function recordAudit(entry: Omit<AuditEvent, "id" | "timestamp">) {
  return auditService.log(entry);
}
