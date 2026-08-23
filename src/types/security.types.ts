export type AuditEvent = {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  resourceType: string;
  resourceId: string;
  hospitalId?: string;
  districtId?: string;
  timestamp: string;
  result: "success" | "denied" | "failure";
};

export type ConsentStatus = "granted" | "withdrawn" | "expired";

export type Consent = {
  id: string;
  patientId: string;
  purpose: string;
  status: ConsentStatus;
  grantedAt: string;
  expiresAt?: string;
  grantedBy: string;
};

export type ConsentHistoryEntry = {
  id: string;
  consentId: string;
  status: ConsentStatus;
  changedAt: string;
  changedBy: string;
};
