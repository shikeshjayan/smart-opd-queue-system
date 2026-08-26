import "server-only";

import { AuditLogModel } from "@/lib/models";
import type { SessionUser } from "@/features/auth/types/auth.types";

export type OpsAuditInput = {
  action: string;
  resourceType: string;
  resourceId?: string;
  hospitalId?: string;
  districtId?: string;
  detail?: Record<string, unknown>;
};

/** Fire-and-forget operational audit entry for hospital administration actions. */
export function auditOps(user: SessionUser | null, input: OpsAuditInput): void {
  void AuditLogModel.create({
    actorId: user?.id,
    actorName: user?.name,
    actorRole: user?.role,
    action: input.action,
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    hospitalId: input.hospitalId,
    districtId: input.districtId,
    result: "success",
    detail: input.detail ?? {},
  }).catch(() => {
    // auditing must never break the primary operation
  });
}
