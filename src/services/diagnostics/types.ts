export type DiagnosticCategory = "laboratory" | "imaging" | "other";

export type CatalogParameter = {
  key: string;
  name: string;
  unit?: string;
  refLow?: number;
  refHigh?: number;
  refText?: string;
  numeric: boolean;
};

export type TestCatalogItem = {
  id: string;
  name: string;
  category: DiagnosticCategory;
  specimenType: string;
  parameters: CatalogParameter[];
  note?: string;
};

export type DiagnosticOrderItem = {
  testId: string;
  testName: string;
  category: DiagnosticCategory;
  priority: "routine" | "urgent";
  instructions?: string;
};

export type DiagnosticOrderStatus =
  | "draft"
  | "ordered"
  | "sample_collected"
  | "processing"
  | "completed"
  | "cancelled";

export type DiagnosticOrder = {
  id: string;
  patientId: string;
  encounterId: string;
  doctorId: string;
  doctorName: string;
  hospitalId: string;
  hospitalName: string;
  departmentName: string;
  createdAt: string;
  orderedAt?: string;
  completedAt?: string;
  items: DiagnosticOrderItem[];
  clinicalNotes?: string;
  status: DiagnosticOrderStatus;
  specimenId?: string;
  cancelledReason?: string;
};

export type DiagnosticOrderContextRef = {
  patientId: string;
  doctorId: string;
  doctorName: string;
  hospitalId: string;
  hospitalName: string;
  departmentName: string;
};

export type SpecimenStatus =
  | "pending"
  | "collected"
  | "received"
  | "processing"
  | "rejected"
  | "completed";

export type Specimen = {
  id: string;
  orderId: string;
  patientId: string;
  type: string;
  status: SpecimenStatus;
  collectedAt?: string;
  rejectionReason?: string;
  createdAt: string;
};

export type ResultFlag = "normal" | "low" | "high" | null;

export type ResultValue = {
  parameterKey: string;
  name: string;
  unit?: string;
  value: string;
  refText?: string;
  refLow?: number;
  refHigh?: number;
  flag: ResultFlag;
};

export type ResultStatus = "draft" | "preliminary" | "final" | "amended" | "cancelled";

export type DiagnosticResult = {
  id: string;
  orderId: string;
  testId: string;
  testName: string;
  category: DiagnosticCategory;
  patientId: string;
  status: ResultStatus;
  values: ResultValue[];
  notes?: string;
  draftedAt?: string;
  finalizedAt?: string;
  amendedFrom?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  cancelledReason?: string;
};

export type PatientTestEntry = {
  orderId: string;
  testId: string;
  testName: string;
  category: DiagnosticCategory;
  orderStatus: DiagnosticOrderStatus;
  resultStatus: ResultStatus | null;
  resultId: string | null;
  orderedAt: string;
  reportedAt: string | null;
};

export function computeResultFlag(
  value: string,
  param: CatalogParameter
): ResultFlag {
  if (!param.numeric) return null;
  const n = Number.parseFloat(value.replace(/[^0-9.\-]/g, ""));
  if (Number.isNaN(n)) return null;
  if (param.refLow !== undefined && n < param.refLow) return "low";
  if (param.refHigh !== undefined && n > param.refHigh) return "high";
  return "normal";
}