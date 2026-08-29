"use server";

import "server-only";
import { dbConnect } from "@/lib/db";
import {
  MedicineModel,
  MedicineStockModel,
  StockTransactionModel,
  PharmacyAuditModel,
  InventoryConfigModel,
  DispensingModel,
  plain,
  plainList,
} from "@/lib/models";
import type { AccessContext } from "@/server/lib/access-context";
import { assertHospitalAccess, assertPatientAccess, assertAnyHospitalAccess } from "@/server/lib/scope-access";
import type {
  MedicineStockBatch,
  StockTransaction,
  StockTransactionType,
  InventoryConfig,
} from "@/services/pharmacy/types";
import type { Medicine } from "@/types";

function txId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export class PharmacyRepository {
  /* ---------- Medicine master catalogue ---------- */

  async listMedicines(ctx: AccessContext, search?: string): Promise<Medicine[]> {
    await dbConnect();
    const filter = search
      ? { $text: { $search: search }, status: "active" }
      : { status: "active" };
    const docs = await MedicineModel.find(filter).sort({ name: 1 }).limit(500).lean();
    return plainList<Medicine>(docs);
  }

  async findMedicineById(medicineId: string): Promise<Medicine | null> {
    await dbConnect();
    const doc = await MedicineModel.findById(medicineId).lean();
    return plain<Medicine>(doc);
  }

  async createMedicine(data: {
    name: string;
    genericName?: string;
    strength?: string;
    dosageForm?: string;
    unit: string;
  }): Promise<Medicine> {
    await dbConnect();
    const doc = await MedicineModel.create({
      _id: txId("med"),
      ...data,
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return plain<Medicine>(doc);
  }

  /* ---------- Batch-level stock ---------- */

  async findStockByHospital(hospitalId: string, ctx: AccessContext): Promise<MedicineStockBatch[]> {
    await dbConnect();
    assertHospitalAccess(ctx, hospitalId);
    const docs = await MedicineStockModel.find({ hospitalId }).sort({ expiryDate: 1 }).lean();
    return plainList<MedicineStockBatch>(docs);
  }

  async findStockByMedicine(hospitalId: string, medicineId: string, ctx: AccessContext): Promise<MedicineStockBatch[]> {
    await dbConnect();
    assertHospitalAccess(ctx, hospitalId);
    const docs = await MedicineStockModel.find({ hospitalId, medicineId }).sort({ expiryDate: 1 }).lean();
    return plainList<MedicineStockBatch>(docs);
  }

  async getDispenseableStock(hospitalId: string, medicineId: string, ctx: AccessContext): Promise<MedicineStockBatch[]> {
    await dbConnect();
    assertHospitalAccess(ctx, hospitalId);
    const docs = await MedicineStockModel.find({
      hospitalId,
      medicineId,
      status: "available",
      quantity: { $gt: 0 },
    })
      .sort({ expiryDate: 1 })
      .lean();
    return plainList<MedicineStockBatch>(docs);
  }

  async findBatchById(stockId: string, ctx: AccessContext): Promise<MedicineStockBatch | null> {
    await dbConnect();
    const doc = await MedicineStockModel.findById(stockId).lean();
    if (doc) assertHospitalAccess(ctx, String((doc as Record<string, unknown>).hospitalId));
    return plain<MedicineStockBatch>(doc);
  }

  async createBatch(data: {
    medicineId: string;
    hospitalId: string;
    batchNumber: string;
    quantity: number;
    expiryDate: string;
    unit?: string;
    receivedAt?: string;
  }, ctx: AccessContext): Promise<MedicineStockBatch> {
    await dbConnect();
    assertHospitalAccess(ctx, data.hospitalId);
    const stockId = `${data.hospitalId}:${data.medicineId}:${data.batchNumber}`;
    const now = new Date().toISOString();
    const doc = await MedicineStockModel.findByIdAndUpdate(
      stockId,
      {
        $setOnInsert: {
          _id: stockId,
          stockId,
          medicineId: data.medicineId,
          hospitalId: data.hospitalId,
          batchNumber: data.batchNumber,
          receivedQuantity: data.quantity,
          quantity: data.quantity,
          availableQuantity: data.quantity,
          expiryDate: data.expiryDate,
          unit: data.unit ?? "units",
          status: "available",
          receivedAt: data.receivedAt ?? now,
          createdAt: now,
          updatedAt: now,
        },
      },
      { new: true, upsert: true }
    ).lean();
    return plain<MedicineStockBatch>(doc);
  }

  async addToBatch(stockId: string, qty: number, ctx: AccessContext): Promise<MedicineStockBatch | null> {
    await dbConnect();
    const doc = await MedicineStockModel.findByIdAndUpdate(
      stockId,
      { $inc: { quantity: qty, availableQuantity: qty, receivedQuantity: qty } },
      { new: true }
    ).lean();
    if (doc) assertHospitalAccess(ctx, String((doc as Record<string, unknown>).hospitalId));
    return plain<MedicineStockBatch>(doc);
  }

  async deductFromBatch(stockId: string, qty: number, ctx: AccessContext): Promise<MedicineStockBatch | null> {
    await dbConnect();
    const doc = await MedicineStockModel.findById(stockId).lean();
    if (!doc) return null;
    if (!doc || (doc as Record<string, unknown>).hospitalId) {
      assertHospitalAccess(ctx, String((doc as Record<string, unknown>).hospitalId));
    }
    const next = (doc as Record<string, unknown>).quantity as number;
    if (next < qty) throw new Error("Insufficient batch quantity");
    const updated = await MedicineStockModel.findByIdAndUpdate(
      stockId,
      {
        $set: {
          quantity: next - qty,
          availableQuantity: next - qty,
          status: next - qty === 0 ? "depleted" : (doc as Record<string, unknown>).status,
          updatedAt: new Date().toISOString(),
        },
      },
      { new: true }
    ).lean();
    return plain<MedicineStockBatch>(updated);
  }

  async setBatchStatus(
    stockId: string,
    status: MedicineStockBatch["status"],
    ctx: AccessContext
  ): Promise<MedicineStockBatch | null> {
    await dbConnect();
    const doc = await MedicineStockModel.findByIdAndUpdate(
      stockId,
      { $set: { status, updatedAt: new Date().toISOString() } },
      { new: true }
    ).lean();
    if (doc) assertHospitalAccess(ctx, String((doc as Record<string, unknown>).hospitalId));
    return plain<MedicineStockBatch>(doc);
  }

  /* ---------- Immutable stock transaction ledger ---------- */

  async createTransaction(
    data: {
      medicineId: string;
      medicineName?: string;
      hospitalId: string;
      stockId: string;
      batchNumber?: string;
      type: StockTransactionType;
      quantity: number;
      prescriptionId?: string;
      note?: string;
      actor: { id: string; name: string; role: string };
    },
    ctx: AccessContext
  ): Promise<StockTransaction> {
    await dbConnect();
    assertHospitalAccess(ctx, data.hospitalId);
    const doc = await StockTransactionModel.create({
      _id: txId("tx"),
      txId: txId("tx"),
      stockId: data.stockId,
      medicineId: data.medicineId,
      medicineName: data.medicineName,
      hospitalId: data.hospitalId,
      type: data.type,
      delta: data.quantity,
      balanceAfter: data.quantity,
      batchNumber: data.batchNumber,
      prescriptionId: data.prescriptionId,
      note: data.note,
      actorId: data.actor.id,
      actorName: data.actor.name,
      actorRole: data.actor.role,
      createdAt: new Date().toISOString(),
    });
    return plain<StockTransaction>(doc);
  }

  async listTransactions(hospitalId: string, ctx: AccessContext, limit = 100): Promise<StockTransaction[]> {
    await dbConnect();
    assertHospitalAccess(ctx, hospitalId);
    const docs = await StockTransactionModel.find({ hospitalId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    return plainList<StockTransaction>(docs);
  }

  async listTransactionsByMedicine(
    hospitalId: string,
    medicineId: string,
    ctx: AccessContext,
    limit = 100
  ): Promise<StockTransaction[]> {
    await dbConnect();
    assertHospitalAccess(ctx, hospitalId);
    const docs = await StockTransactionModel.find({ hospitalId, medicineId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    return plainList<StockTransaction>(docs);
  }

  /* ---------- Dispensing records ---------- */

  async createDispensing(data: {
    patientId: string;
    prescriptionId: string;
    encounterId: string;
    hospitalId: string;
    pharmacyId?: string;
    pharmacistId: string;
    items: Array<{
      medicineId: string;
      batchId: string;
      prescribedQuantity: number;
      dispensedQuantity: number;
      instructions?: string;
    }>;
    status: "completed" | "partial" | "cancelled";
    dispensedAt: string;
  }, ctx: AccessContext): Promise<Record<string, unknown>> {
    await dbConnect();
    assertHospitalAccess(ctx, data.hospitalId);
    const doc = await DispensingModel.create({
      _id: txId("disp"),
      patientId: data.patientId,
      prescriptionId: data.prescriptionId,
      encounterId: data.encounterId,
      hospitalId: data.hospitalId,
      pharmacyId: data.pharmacyId,
      pharmacistId: data.pharmacistId,
      items: data.items,
      status: data.status,
      dispensedAt: data.dispensedAt,
      createdAt: new Date(),
    });
    return plain<Record<string, unknown>>(doc);
  }

  async listDispensingByHospital(hospitalId: string, ctx: AccessContext, limit = 100): Promise<Record<string, unknown>[]> {
    await dbConnect();
    assertHospitalAccess(ctx, hospitalId);
    const docs = await DispensingModel.find({ hospitalId })
      .sort({ dispensedAt: -1 })
      .limit(limit)
      .lean();
    return plainList<Record<string, unknown>>(docs);
  }

  async countDispensingToday(hospitalId: string, ctx: AccessContext): Promise<number> {
    await dbConnect();
    assertHospitalAccess(ctx, hospitalId);
    const today = new Date().toISOString().slice(0, 10);
    return DispensingModel.countDocuments({ hospitalId, dispensedAt: { $regex: `^${today}` } });
  }

  async listDispensingByPatient(patientId: string, ctx: AccessContext, limit = 50): Promise<Record<string, unknown>[]> {
    await dbConnect();
    assertPatientAccess(ctx, patientId);
    const docs = await DispensingModel.find({ patientId }).sort({ dispensedAt: -1 }).limit(limit).lean();
    return plainList<Record<string, unknown>>(docs);
  }

  /* ---------- Pharmacy audit ---------- */

  async logAudit(data: {
    action: string;
    actor: { id: string; name: string; role: string };
    prescriptionId?: string;
    stockId?: string;
    medicineId?: string;
    detail?: Record<string, unknown>;
  }, ctx: AccessContext): Promise<void> {
    await dbConnect();
    assertAnyHospitalAccess(ctx);
    await PharmacyAuditModel.create({
      _id: txId("pha"),
      action: data.action,
      actorId: data.actor.id,
      actorName: data.actor.name,
      actorRole: data.actor.role,
      prescriptionId: data.prescriptionId,
      stockId: data.stockId,
      medicineId: data.medicineId,
      detail: data.detail,
      createdAt: new Date(),
    });
  }

  /* ---------- Inventory thresholds ---------- */

  async getThreshold(hospitalId: string, medicineId: string, ctx: AccessContext): Promise<InventoryConfig | null> {
    await dbConnect();
    assertHospitalAccess(ctx, hospitalId);
    const doc = await InventoryConfigModel.findOne({ hospitalId, medicineId }).lean();
    return plain<InventoryConfig>(doc);
  }

  async upsertThreshold(
    hospitalId: string,
    medicineId: string,
    minLevel: number,
    ctx: AccessContext
  ): Promise<InventoryConfig> {
    await dbConnect();
    assertHospitalAccess(ctx, hospitalId);
    const doc = await InventoryConfigModel.findOneAndUpdate(
      { hospitalId, medicineId },
      { $set: { hospitalId, medicineId, minLevel, updatedAt: new Date().toISOString() } },
      { new: true, upsert: true }
    ).lean();
    return plain<InventoryConfig>(doc);
  }

  async listThresholds(hospitalId: string, ctx: AccessContext): Promise<InventoryConfig[]> {
    await dbConnect();
    assertHospitalAccess(ctx, hospitalId);
    const docs = await InventoryConfigModel.find({ hospitalId }).lean();
    return plainList<InventoryConfig>(docs);
  }

  /* ---------- Aggregations (dashboard/alerts) ---------- */

  async sumStockByMedicine(hospitalId: string, medicineId: string, ctx: AccessContext): Promise<number> {
    await dbConnect();
    assertHospitalAccess(ctx, hospitalId);
    const rows = await MedicineStockModel.aggregate([
      { $match: { hospitalId, medicineId, status: "available" } },
      { $group: { _id: null, total: { $sum: "$quantity" } } },
    ]);
    return rows.length ? (rows[0].total as number) : 0;
  }

  async findExpiringBatches(hospitalId: string, ctx: AccessContext, withinDays: number): Promise<MedicineStockBatch[]> {
    await dbConnect();
    assertHospitalAccess(ctx, hospitalId);
    const horizon = new Date(Date.now() + withinDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const docs = await MedicineStockModel.find({
      hospitalId,
      status: "available",
      quantity: { $gt: 0 },
      expiryDate: { $gte: new Date().toISOString().slice(0, 10), $lte: horizon },
    })
      .sort({ expiryDate: 1 })
      .lean();
    return plainList<MedicineStockBatch>(docs);
  }

  async findExpiredBatches(hospitalId: string, ctx: AccessContext): Promise<MedicineStockBatch[]> {
    await dbConnect();
    assertHospitalAccess(ctx, hospitalId);
    const today = new Date().toISOString().slice(0, 10);
    const docs = await MedicineStockModel.find({
      hospitalId,
      quantity: { $gt: 0 },
      expiryDate: { $lt: today },
    })
      .sort({ expiryDate: 1 })
      .lean();
    return plainList<MedicineStockBatch>(docs);
  }
}

export const pharmacyRepository = new PharmacyRepository();