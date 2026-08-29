"use server";

import "server-only";
import mongoose from "mongoose";
import { pharmacyRepository } from "@/server/repositories/pharmacy.repository";
import { prescriptionRepository } from "@/server/repositories/medical-records.repository";
import type { AccessContext } from "@/server/lib/access-context";
import { assertPermission, assertHospitalAccess } from "@/server/lib/scope-access";
import { PrescriptionModel } from "@/lib/models";
import { dbConnect } from "@/lib/db";
import type { DispenseLineInput, DispenseOutcome, DispenseLineOutcome } from "@/services/pharmacy/types";
import { fefoCompare } from "@/services/pharmacy/types";
import type { MedicalPrescription } from "@/server/repositories/medical-records.repository";

type RxItem = {
  id?: string;
  medicineId?: string;
  medicineName?: string;
  dosage?: string;
  frequency?: string;
  quantity?: number;
  alreadyDispensed?: number;
};

function itemAlreadyDispensed(prescription: MedicalPrescription, itemId: string | undefined): number {
  if (!itemId) return 0;
  const records = prescription.dispensedItems as Array<Record<string, unknown>> | undefined;
  if (!Array.isArray(records)) return 0;
  let total = 0;
  for (const r of records) {
    if ((r.dispensedItems as Array<Record<string, unknown>> | undefined) && Array.isArray(r.dispensedItems)) {
      for (const di of r.dispensedItems as Array<Record<string, unknown>>) {
        if (di.itemId === itemId || di.medicineId === itemId) {
          total += typeof di.qty === "number" ? di.qty : 0;
        }
      }
    } else if (r.itemId === itemId || r.medicineId === itemId) {
      total += typeof r.qty === "number" ? r.qty : 0;
    }
  }
  return total;
}

export class DispensingService {
  /**
   * Atomically dispense a prescription against FEFO-ordered batch stock.
   * Partial fulfillment is allowed: any line that cannot be fully met keeps
   * remaining > 0 and the prescription is marked partially_dispensed.
   */
  async dispensePrescription(
    prescriptionId: string,
    hospitalId: string,
    items: DispenseLineInput[],
    ctx: AccessContext
  ): Promise<DispenseOutcome> {
    assertPermission(ctx, "DISPENSE_MEDICATION");
    assertHospitalAccess(ctx, hospitalId);
    await dbConnect();

    if (!items || items.length === 0) {
      return {
        ok: false,
        error: "No medicine lines provided to dispense",
        prescriptionId,
        status: "partially_dispensed",
        lines: [],
      };
    }

    const prescription = await prescriptionRepository.findById(prescriptionId, ctx);
    if (!prescription) {
      return { ok: false, error: "Prescription not found", prescriptionId, status: "partially_dispensed", lines: [] };
    }
    if (prescription.hospitalId && prescription.hospitalId !== hospitalId) {
      return {
        ok: false,
        error: "Prescription does not belong to this hospital",
        prescriptionId,
        status: "partially_dispensed",
        lines: [],
      };
    }
    if (prescription.status === "dispensed") {
      return {
        ok: false,
        error: "Prescription already fully dispensed",
        prescriptionId,
        status: "dispensed",
        lines: [],
      };
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const lines: DispenseLineOutcome[] = [];
      let allFulfilled = true;

      for (const item of items) {
        const rx = prescription.items.find((rxItem) => {
          if (!item.itemId) return false;
          const itemWithId = rxItem as RxItem;
          return itemWithId.id === item.itemId || itemWithId.medicineId === item.itemId;
        });
        const rxNarrow = (rx ?? {}) as RxItem;
        const medicineName = rxNarrow.medicineName ?? "Medicine";
        if (!item.itemId) {
          lines.push({
            itemId: "",
            medicineId: item.medicineId,
            medicineName,
            requested: item.quantity,
            dispensed: 0,
            remaining: item.quantity,
            batchesUsed: [],
          });
          allFulfilled = false;
          continue;
        }

        const already = itemAlreadyDispensed(prescription, item.itemId);
        const stillNeeded = Math.max(0, item.quantity - already);

        if (stillNeeded <= 0) {
          lines.push({
            itemId: item.itemId,
            medicineId: item.medicineId,
            medicineName,
            requested: item.quantity,
            dispensed: 0,
            remaining: 0,
            batchesUsed: [],
          });
          continue;
        }

        let remaining = stillNeeded;
        const batchesUsed: DispenseLineOutcome["batchesUsed"] = [];
        const stock = await pharmacyRepository.getDispenseableStock(hospitalId, item.medicineId, ctx);

        for (const batch of [...stock].sort(fefoCompare)) {
          if (remaining <= 0) break;
          const take = Math.min(batch.quantity, remaining);
          if (take <= 0) continue;

          await pharmacyRepository.deductFromBatch(batch.stockId, take, ctx);
          await pharmacyRepository.createTransaction(
            {
              medicineId: item.medicineId,
              medicineName,
              hospitalId,
              stockId: batch.stockId,
              batchNumber: batch.batchNumber,
              type: "dispensed",
              quantity: -take,
              prescriptionId,
              actor: { id: ctx.userId, name: ctx.userId, role: ctx.role },
            },
            ctx
          );

          remaining -= take;
          batchesUsed.push({ stockId: batch.stockId, batchNumber: batch.batchNumber, expiryDate: batch.expiryDate, qty: take });
        }

        const dispensed = stillNeeded - remaining;
        const lineRemaining = item.quantity - already - dispensed;
        if (lineRemaining > 0) allFulfilled = false;
        lines.push({
          itemId: item.itemId,
          medicineId: item.medicineId,
          medicineName,
          requested: item.quantity,
          dispensed,
          remaining: lineRemaining,
          batchesUsed,
        });
      }

      const finalStatus = allFulfilled ? "dispensed" : "partially_dispensed";

      // Persist dispensing record + prescription state inside the same session.
      const recordId = `disp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const rxDoc = await PrescriptionModel.findById(prescriptionId).session(session);
      if (rxDoc) {
        const prev = (rxDoc as Record<string, unknown>).dispensedItems as Array<Record<string, unknown>> | undefined;
        rxDoc.set("status", finalStatus);
        rxDoc.set("updatedAt", new Date().toISOString());
        rxDoc.set("dispensedItems", [
          ...(prev ?? []),
          {
            batch: recordId,
            timestamp: new Date().toISOString(),
            hospitalId,
            itemId: lines.map((l) => l.itemId),
            medicineIds: lines.map((l) => l.medicineId),
            quantities: lines.map((l) => l.dispensed),
            totalDispensed: lines.reduce((s, l) => s + l.dispensed, 0),
            by: ctx.userId,
          },
        ]);
        await rxDoc.save({ session });
      }

      await pharmacyRepository.createDispensing(
        {
          patientId: String(prescription.patientId),
          prescriptionId,
          encounterId: String(prescription.encounterId ?? ""),
          hospitalId,
          pharmacistId: ctx.userId,
          items: lines.flatMap((l) =>
            l.batchesUsed.map((b) => ({
              medicineId: l.medicineId,
              batchId: b.stockId,
              prescribedQuantity: l.requested,
              dispensedQuantity: b.qty,
            }))
          ),
          status: finalStatus === "dispensed" ? "completed" : "partial",
          dispensedAt: new Date().toISOString(),
        },
        ctx
      );

      await pharmacyRepository.logAudit(
        {
          action: finalStatus === "dispensed" ? "prescription_dispensed" : "prescription_partially_dispensed",
          actor: { id: ctx.userId, name: ctx.userId, role: ctx.role },
          prescriptionId,
          detail: { totalDispensed: lines.reduce((s, l) => s + l.dispensed, 0), lines },
        },
        ctx
      );

      await session.commitTransaction();
      return { ok: true, prescriptionId, status: finalStatus, lines };
    } catch (e) {
      await session.abortTransaction();
      return {
        ok: false,
        error: e instanceof Error ? e.message : "Dispensing failed",
        prescriptionId,
        status: "partially_dispensed",
        lines: [],
      };
    } finally {
      await session.endSession();
    }
  }

  /** Build the availability checklist (quantity per item already dispensed vs remaining & in stock). */
  async getAvailability(prescriptionId: string, hospitalId: string, ctx: AccessContext) {
    assertPermission(ctx, "VIEW_PHARMACY_QUEUE");
    const prescription = await prescriptionRepository.findById(prescriptionId, ctx);
    if (!prescription) return [];
    const today = new Date().toISOString().slice(0, 10);
    void today;
    const lines = [];
    for (const rxItem of prescription.items) {
      const item = rxItem as RxItem;
      const availableQty = await pharmacyRepository.sumStockByMedicine(hospitalId, item.medicineId ?? "", ctx);
      lines.push({
        itemId: item.id ?? item.medicineId ?? "",
        medicineId: item.medicineId ?? "",
        medicineName: item.medicineName ?? "Medicine",
        dosage: item.dosage ?? "",
        frequency: item.frequency ?? "",
        durationLabel: "",
        prescribedQty: item.quantity ?? 0,
        alreadyDispensed: itemAlreadyDispensed(prescription, item.id),
        remainingQty: Math.max(0, (item.quantity ?? 0) - itemAlreadyDispensed(prescription, item.id)),
        availableQty,
        sufficient: availableQty >= Math.max(0, (item.quantity ?? 0) - itemAlreadyDispensed(prescription, item.id)),
        batchesPreview: [],
      });
    }
    return lines;
  }
}

export const dispensingService = new DispensingService();