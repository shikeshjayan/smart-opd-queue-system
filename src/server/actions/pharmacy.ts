"use server";

import "server-only";
import { getSession } from "@/lib/auth";
import { resolveAccessContext } from "@/server/lib/resolve-access-context";
import { medicineService } from "@/server/services/pharmacy/medicine.service";
import { inventoryService } from "@/server/services/pharmacy/inventory.service";
import { dispensingService } from "@/server/services/pharmacy/dispensing.service";
import { stockAlertService } from "@/server/services/pharmacy/stock-alert.service";
import { pharmacyRepository } from "@/server/repositories/pharmacy.repository";
import { prescriptionRepository } from "@/server/repositories/medical-records.repository";
import { PatientModel, DoctorModel, HospitalModel } from "@/lib/models";
import { dbConnect } from "@/lib/db";
import type { AccessContext } from "@/server/lib/access-context";
import type {
  DispenseLineInput,
  MedicineStockBatch,
  LowStockAlertEntry,
  ExpiringBatchAlertEntry,
} from "@/services/pharmacy/types";
import { EXPIRY_ALERT_DAYS } from "@/services/pharmacy/types";
import type { Medicine, DispensingRecord } from "@/types";

async function getAccessContext(): Promise<AccessContext> {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return resolveAccessContext(session);
}

function resolveHospital(ctx: AccessContext, hospitalId?: string): string {
  if (hospitalId) return hospitalId;
  const ids = ctx.getAuthorizedHospitalIds();
  if (ids.length === 1) return ids[0];
  throw new Error("Hospital context required");
}

/* ---------- Dashboard & alerts ---------- */

export async function getPharmacyDashboard(hospitalId?: string) {
  const ctx = await getAccessContext();
  return stockAlertService.dashboard(resolveHospital(ctx, hospitalId), ctx);
}

export async function getPharmacyQueue(hospitalId?: string, limit = 100) {
  const ctx = await getAccessContext();
  const hospital = resolveHospital(ctx, hospitalId);
  const prescriptions = await prescriptionRepository.findSentToPharmacy(hospital, ctx, limit);
  await dbConnect();
  const entries = [];
  for (const rx of prescriptions) {
    const availability = await dispensingService.getAvailability(rx.id, hospital, ctx);
    const patDoc = rx.patientId
      ? await PatientModel.findOne({ _id: rx.patientId })
          .select("name tokenNumber")
          .lean<{ name?: string; tokenNumber?: string } | null>()
      : null;
    const docDoc = rx.doctorId
      ? await DoctorModel.findOne({ _id: rx.doctorId })
          .select("name")
          .lean<{ name?: string } | null>()
      : null;
    const hospDoc = await HospitalModel.findById(hospital).select("name").lean();
    entries.push({
      prescriptionId: rx.id,
      encounterId: rx.encounterId,
      patientId: rx.patientId,
      patientName: patDoc?.name ?? "Patient",
      tokenNumber: patDoc?.tokenNumber,
      hospitalId: hospital,
      hospitalName: hospDoc?.name ?? "",
      departmentName: "",
      doctorName: docDoc?.name ?? rx.doctorName ?? "",
      finalizedAt: rx.finalizedAt,
      status: (rx.status === "dispensed"
        ? "sent_to_pharmacy"
        : rx.status) as "sent_to_pharmacy" | "partially_dispensed",
      items: availability,
      dispatchedAt: rx.updatedAt,
    });
  }
  return entries;
}

export async function getLowStockAlerts(hospitalId?: string): Promise<LowStockAlertEntry[]> {
  const ctx = await getAccessContext();
  return stockAlertService.lowStock(resolveHospital(ctx, hospitalId), ctx);
}

export async function getExpiringAlerts(
  hospitalId?: string,
  withinDays = EXPIRY_ALERT_DAYS
): Promise<ExpiringBatchAlertEntry[]> {
  const ctx = await getAccessContext();
  return stockAlertService.expiringSoon(resolveHospital(ctx, hospitalId), ctx, withinDays);
}

/* ---------- Stock & inventory ---------- */

export async function listStock(hospitalId?: string): Promise<MedicineStockBatch[]> {
  const ctx = await getAccessContext();
  return inventoryService.listBatches(resolveHospital(ctx, hospitalId), ctx);
}

export async function getInventorySummary(hospitalId?: string) {
  const ctx = await getAccessContext();
  return inventoryService.getSummary(resolveHospital(ctx, hospitalId), ctx);
}

export async function receiveStock(data: {
  hospitalId: string;
  medicineId: string;
  medicineName?: string;
  batchNumber: string;
  quantity: number;
  expiryDate: string;
  unit?: string;
}) {
  const ctx = await getAccessContext();
  return inventoryService.receiveStock(data, ctx);
}

export async function adjustStock(data: {
  hospitalId: string;
  stockId: string;
  medicineId: string;
  medicineName?: string;
  batchNumber?: string;
  delta: number;
  reason: string;
}) {
  const ctx = await getAccessContext();
  return inventoryService.adjustStock(data, ctx);
}

export async function markBatchStatus(
  stockId: string,
  status: MedicineStockBatch["status"],
  reason: string
) {
  const ctx = await getAccessContext();
  return inventoryService.setBatchStatus(stockId, status, reason, ctx);
}

export async function upsertStockThreshold(hospitalId: string, medicineId: string, minLevel: number) {
  const ctx = await getAccessContext();
  return inventoryService.upsertThreshold(hospitalId, medicineId, minLevel, ctx);
}

export async function listStockThresholds(hospitalId?: string) {
  const ctx = await getAccessContext();
  return inventoryService.listThresholds(resolveHospital(ctx, hospitalId), ctx);
}

export async function listStockTransactions(hospitalId?: string, limit = 100) {
  const ctx = await getAccessContext();
  return pharmacyRepository.listTransactions(resolveHospital(ctx, hospitalId), ctx, limit);
}

/* ---------- Dispensing ---------- */

export async function dispatchToPharmacy(prescriptionId: string) {
  const ctx = await getAccessContext();
  const prescription = await prescriptionRepository.findById(prescriptionId, ctx);
  if (!prescription) throw new Error("Prescription not found");
  await dbConnect();
  await prescriptionRepository.updateStatus(prescriptionId, "sent_to_pharmacy", ctx);
  return { success: true, prescriptionId };
}

export async function dispensePrescription(
  prescriptionId: string,
  hospitalId: string | undefined,
  items: DispenseLineInput[]
) {
  const ctx = await getAccessContext();
  return dispensingService.dispensePrescription(prescriptionId, resolveHospital(ctx, hospitalId), items, ctx);
}

export async function getPrescriptionAvailability(prescriptionId: string, hospitalId?: string) {
  const ctx = await getAccessContext();
  return dispensingService.getAvailability(prescriptionId, resolveHospital(ctx, hospitalId), ctx);
}

export async function listDispensingHistory(hospitalId?: string, limit = 50): Promise<DispensingRecord[]> {
  const ctx = await getAccessContext();
  const docs = await pharmacyRepository.listDispensingByHospital(resolveHospital(ctx, hospitalId), ctx, limit);
  return docs as unknown as DispensingRecord[];
}

export async function getPatientDispensingHistory(patientId: string, limit = 50) {
  const ctx = await getAccessContext();
  const docs = await pharmacyRepository.listDispensingByPatient(patientId, ctx, limit);
  return docs as unknown as DispensingRecord[];
}

/* ---------- Medicine catalogue ---------- */

export async function listMedicines(search?: string): Promise<Medicine[]> {
  const ctx = await getAccessContext();
  return medicineService.list(ctx, search);
}

export async function createMedicine(data: {
  name: string;
  genericName?: string;
  strength?: string;
  dosageForm?: string;
  unit: string;
}): Promise<Medicine> {
  const ctx = await getAccessContext();
  return medicineService.create(data, ctx);
}

/* ---------- Audit ---------- */

export async function getPharmacyAuditLog(hospitalId?: string) {
  const ctx = await getAccessContext();
  const hospital = resolveHospital(ctx, hospitalId);
  return pharmacyRepository.listTransactions(hospital, ctx, 200);
}

export async function getPharmacyQueueStats(hospitalId?: string) {
  const ctx = await getAccessContext();
  const hospital = resolveHospital(ctx, hospitalId);
  const [pending, partial, completed] = await Promise.all([
    prescriptionRepository.countPrescriptionsByStatus(hospital, "sent_to_pharmacy", ctx),
    prescriptionRepository.countPrescriptionsByStatus(hospital, "partially_dispensed", ctx),
    prescriptionRepository.countPrescriptionsByStatus(hospital, "dispensed", ctx),
  ]);
  return { pending, partial, completed };
}