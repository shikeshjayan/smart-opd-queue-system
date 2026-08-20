export type PharmacyQueueStatus = "awaiting_dispatch" | "partially_dispensed" | "dispensed" | "issue";

export type PharmacyQueueEntry = {
  prescriptionId: string;
  encounterId: string;
  patientId: string;
  patientName: string;
  tokenNumber: string;
  hospitalName: string;
  departmentName: string;
  status: PharmacyQueueStatus;
  items: number;
  itemsDispensed: number;
  requestedAt: string;
  dispensedAt?: string;
};

export type DispenseActivityType = "dispatched" | "dispensed" | "partially_dispensed";

export type DispenseActivity = {
  id: string;
  prescriptionId: string;
  action: DispenseActivityType;
  at: string;
  by: string;
};