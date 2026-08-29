"use server";

import "server-only";
import { pharmacyRepository } from "@/server/repositories/pharmacy.repository";
import { prescriptionRepository } from "@/server/repositories/medical-records.repository";
import type { AccessContext } from "@/server/lib/access-context";
import { assertPermission, assertHospitalAccess } from "@/server/lib/scope-access";
import type {
  LowStockAlertEntry,
  ExpiringBatchAlertEntry,
  PharmacyDashboardStats,
} from "@/services/pharmacy/types";
import { EXPIRY_ALERT_DAYS } from "@/services/pharmacy/types";

export class StockAlertService {
  /** Medicines whose total available quantity is below their configured threshold. */
  async lowStock(hospitalId: string, ctx: AccessContext): Promise<LowStockAlertEntry[]> {
    assertPermission(ctx, "VIEW_PHARMACY_DASHBOARD");
    assertHospitalAccess(ctx, hospitalId);
    const weights = await pharmacyRepository.listThresholds(hospitalId, ctx);
    if (weights.length === 0) return [];
    const entries: LowStockAlertEntry[] = [];
    for (const t of weights) {
      const current = await pharmacyRepository.sumStockByMedicine(hospitalId, t.medicineId, ctx);
      if (current < t.minLevel) {
        const med = await pharmacyRepository.findMedicineById(t.medicineId);
        entries.push({
          medicineId: t.medicineId,
          medicineName: med?.name ?? t.medicineName ?? t.medicineId,
          current,
          minimum: t.minLevel,
          hospitalId,
        });
      }
    }
    return entries.sort((a, b) => a.current / a.minimum - b.current / b.minimum);
  }

  /** Batches expiring within the alert window (still dispenseable). */
  async expiringSoon(
    hospitalId: string,
    ctx: AccessContext,
    withinDays = EXPIRY_ALERT_DAYS
  ): Promise<ExpiringBatchAlertEntry[]> {
    assertPermission(ctx, "VIEW_PHARMACY_DASHBOARD");
    assertHospitalAccess(ctx, hospitalId);
    const batches = await pharmacyRepository.findExpiringBatches(hospitalId, ctx, withinDays);
    const today = new Date();
    const entries: ExpiringBatchAlertEntry[] = [];
    for (const b of batches) {
      const med = await pharmacyRepository.findMedicineById(b.medicineId);
      entries.push({
        stockId: b.stockId,
        medicineId: b.medicineId,
        medicineName: med?.name ?? b.medicineId,
        batchNumber: b.batchNumber,
        quantity: b.quantity,
        expiryDate: b.expiryDate,
        daysToExpiry: Math.ceil((new Date(b.expiryDate).getTime() - today.getTime()) / 86_400_000),
        hospitalId,
      });
    }
    return entries.sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));
  }

  /** Combined dashboard metrics. */
  async dashboard(hospitalId: string, ctx: AccessContext): Promise<PharmacyDashboardStats> {
    assertPermission(ctx, "VIEW_PHARMACY_DASHBOARD");
    assertHospitalAccess(ctx, hospitalId);
    const pending = await prescriptionRepository.countPrescriptionsByStatus(hospitalId, "sent_to_pharmacy", ctx);
    const partial = await prescriptionRepository.countPrescriptionsByStatus(hospitalId, "partially_dispensed", ctx);
    const completedToday = await pharmacyRepository.countDispensingToday(hospitalId, ctx);
    const batches = await pharmacyRepository.findStockByHospital(hospitalId, ctx);
    const weights = await pharmacyRepository.listThresholds(hospitalId, ctx);
    const expiryHorizon = new Date(Date.now() + EXPIRY_ALERT_DAYS * 86_400_000)
      .toISOString()
      .slice(0, 10);
    const today = new Date().toISOString().slice(0, 10);

    let lowStockCount = 0;
    const totals = new Map<string, number>();
    for (const b of batches) {
      if (b.status === "available" || b.status === "depleted") {
        totals.set(b.medicineId, (totals.get(b.medicineId) ?? 0) + b.quantity);
      }
    }
    for (const w of weights) {
      if ((totals.get(w.medicineId) ?? 0) < w.minLevel) lowStockCount += 1;
    }
    const expiringSoonCount = batches.filter((b) => b.quantity > 0 && b.expiryDate >= today && b.expiryDate <= expiryHorizon)
      .length;

    return {
      pending,
      partiallyDispensed: partial,
      completedToday,
      completedTotal: await prescriptionRepository.countPrescriptionsByStatus(hospitalId, "dispensed", ctx),
      lowStockCount,
      expiringSoonCount,
    };
  }
}

export const stockAlertService = new StockAlertService();