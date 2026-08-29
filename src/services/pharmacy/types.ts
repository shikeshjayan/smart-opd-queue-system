/* Server-safe pharmacy domain types shared by server actions + frontend */

export type StockBatchStatus = "available" | "expired" | "blocked" | "recalled" | "depleted";

/** One physical batch of a medicine at one hospital. Quantity lives here, never on the medicine itself. */
export type MedicineStockBatch = {
  id: string;
  stockId: string;
  medicineId: string;
  hospitalId: string;
  batchNumber: string;
  quantity: number;
  expiryDate: string; // ISO date (YYYY-MM-DD)
  unit: string;
  status: StockBatchStatus;
  createdAt: string;
  updatedAt: string;
};

export type StockTransactionType =
  | "received"
  | "dispensed"
  | "damaged"
  | "expired"
  | "adjusted"
  | "blocked"
  | "unblocked";

/** Immutable ledger entry. Current stock = sum of deltas (balanceAfter kept for fast reads). */
export type StockTransaction = {
  id: string;
  txId: string;
  stockId: string;
  medicineId: string;
  medicineName?: string;
  hospitalId: string;
  type: StockTransactionType;
  /** positive = in, negative = out */
  delta: number;
  balanceAfter: number;
  batchNumber?: string;
  prescriptionId?: string;
  note?: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  createdAt: string;
};

export type PharmacyAuditAction =
  | "queue_viewed"
  | "prescription_viewed"
  | "prescription_dispensed"
  | "prescription_partially_dispensed"
  | "quantity_changed"
  | "stock_received"
  | "stock_adjusted"
  | "batch_blocked"
  | "batch_unblocked"
  | "medicine_marked_expired";

export type InventoryConfig = {
  hospitalId: string;
  medicineId: string;
  medicineName?: string;
  minLevel: number;
};

export type MedicineInventorySummary = {
  medicineId: string;
  medicineName: string;
  genericName?: string;
  unit: string;
  totalAvailable: number;
  minLevel: number;
  lowStock: boolean;
  batches: MedicineStockBatch[];
};

export type LowStockAlertEntry = {
  medicineId: string;
  medicineName: string;
  current: number;
  minimum: number;
  hospitalId: string;
};

export type ExpiringBatchAlertEntry = {
  stockId: string;
  medicineId: string;
  medicineName: string;
  batchNumber: string;
  quantity: number;
  expiryDate: string;
  daysToExpiry: number;
  hospitalId: string;
};

export type DispenseLineInput = {
  /** Prescription item id */
  itemId: string;
  medicineId: string;
  /** Units the pharmacist wants to dispense now */
  quantity: number;
};

export type DispenseLineOutcome = {
  itemId: string;
  medicineId: string;
  medicineName: string;
  requested: number;
  dispensed: number;
  remaining: number;
  batchesUsed: { stockId: string; batchNumber: string; expiryDate: string; qty: number }[];
};

export type DispenseOutcome = {
  ok: boolean;
  error?: string;
  prescriptionId: string;
  status: "dispensed" | "partially_dispensed";
  lines: DispenseLineOutcome[];
};

/** Availability snapshot used by the pharmacist verification checklist (§13). */
export type PrescriptionAvailabilityLine = {
  itemId: string;
  medicineId: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  durationLabel: string;
  prescribedQty: number;
  alreadyDispensed: number;
  remainingQty: number;
  availableQty: number;
  sufficient: boolean;
  batchesPreview: { stockId: string; batchNumber: string; expiryDate: string; qty: number }[];
};

export type PharmacyQueueEntryEx = {
  prescriptionId: string;
  encounterId: string;
  patientId: string;
  patientName: string;
  tokenNumber?: string;
  hospitalId: string;
  hospitalName: string;
  departmentName: string;
  doctorName: string;
  finalizedAt?: string;
  status: "sent_to_pharmacy" | "partially_dispensed";
  items: PrescriptionAvailabilityLine[];
  dispatchedAt?: string;
};

export type PharmacyDashboardStats = {
  pending: number;
  partiallyDispensed: number;
  completedToday: number;
  completedTotal: number;
  lowStockCount: number;
  expiringSoonCount: number;
};

/** FEFO ordering: soonest expiry first, skipping non-available batches. */
export function fefoCompare(a: Pick<MedicineStockBatch, "expiryDate">, b: Pick<MedicineStockBatch, "expiryDate">): number {
  return a.expiryDate.localeCompare(b.expiryDate);
}

export const EXPIRY_ALERT_DAYS = 90;
