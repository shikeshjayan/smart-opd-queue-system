
import "server-only";
import { pharmacyRepository } from "@/server/repositories/pharmacy.repository";
import type { AccessContext } from "@/server/lib/access-context";
import { assertPermission } from "@/server/lib/scope-access";
import type {
  MedicineStockBatch,
  MedicineInventorySummary,
  InventoryConfig,
} from "@/services/pharmacy/types";

export class InventoryService {
  async listBatches(hospitalId: string, ctx: AccessContext): Promise<MedicineStockBatch[]> {
    assertPermission(ctx, "VIEW_PHARMACY_INVENTORY");
    return pharmacyRepository.findStockByHospital(hospitalId, ctx);
  }

  async listByMedicine(hospitalId: string, medicineId: string, ctx: AccessContext): Promise<MedicineStockBatch[]> {
    assertPermission(ctx, "VIEW_PHARMACY_INVENTORY");
    return pharmacyRepository.findStockByMedicine(hospitalId, medicineId, ctx);
  }

  async receiveStock(
    data: {
      hospitalId: string;
      medicineId: string;
      medicineName?: string;
      batchNumber: string;
      quantity: number;
      expiryDate: string;
      unit?: string;
    },
    ctx: AccessContext
  ): Promise<MedicineStockBatch> {
    assertPermission(ctx, "MANAGE_PHARMACY_STOCK");
    if (data.quantity <= 0 || !Number.isFinite(data.quantity)) {
      throw new Error("quantity must be a positive number");
    }
    const batch = await pharmacyRepository.createBatch(
      { ...data, receivedAt: new Date().toISOString() },
      ctx
    );
    await pharmacyRepository.addToBatch(batch.stockId, data.quantity, ctx);
    await pharmacyRepository.createTransaction(
      {
        medicineId: data.medicineId,
        medicineName: data.medicineName,
        hospitalId: data.hospitalId,
        stockId: batch.stockId,
        batchNumber: data.batchNumber,
        type: "received",
        quantity: data.quantity,
        note: `Receive batch ${data.batchNumber}`,
        actor: { id: ctx.userId, name: ctx.userId, role: ctx.role },
      },
      ctx
    );
    await pharmacyRepository.logAudit(
      {
        action: "stock_received",
        actor: { id: ctx.userId, name: ctx.userId, role: ctx.role },
        stockId: batch.stockId,
        medicineId: data.medicineId,
        detail: { batchNumber: data.batchNumber, quantity: data.quantity, expiryDate: data.expiryDate },
      },
      ctx
    );
    return batch;
  }

  async adjustStock(
    data: {
      hospitalId: string;
      stockId: string;
      medicineId: string;
      medicineName?: string;
      batchNumber?: string;
      /** signed delta: positive = add, negative = remove */
      delta: number;
      reason: string;
    },
    ctx: AccessContext
  ): Promise<MedicineStockBatch> {
    assertPermission(ctx, "MANAGE_PHARMACY_STOCK");
    const batch = await pharmacyRepository.findBatchById(data.stockId, ctx);
    if (!batch) throw new Error("Stock batch not found");
    const next = batch.quantity + data.delta;
    if (next < 0) throw new Error("Adjustment would make stock negative");
    await pharmacyRepository.addToBatch(data.stockId, data.delta, ctx);
    await pharmacyRepository.createTransaction(
      {
        medicineId: data.medicineId,
        medicineName: data.medicineName,
        hospitalId: data.hospitalId,
        stockId: data.stockId,
        batchNumber: data.batchNumber,
        type: "adjusted",
        quantity: data.delta,
        note: data.reason,
        actor: { id: ctx.userId, name: ctx.userId, role: ctx.role },
      },
      ctx
    );
    await pharmacyRepository.logAudit(
      {
        action: "stock_adjusted",
        actor: { id: ctx.userId, name: ctx.userId, role: ctx.role },
        stockId: data.stockId,
        medicineId: data.medicineId,
        detail: { delta: data.delta, reason: data.reason },
      },
      ctx
    );
    return { ...batch, quantity: next };
  }

  async setBatchStatus(
    stockId: string,
    status: MedicineStockBatch["status"],
    reason: string,
    ctx: AccessContext
  ): Promise<MedicineStockBatch> {
    assertPermission(ctx, "MANAGE_PHARMACY_STOCK");
    const batch = await pharmacyRepository.findBatchById(stockId, ctx);
    if (!batch) throw new Error("Stock batch not found");
    const updated = await pharmacyRepository.setBatchStatus(stockId, status, ctx);
    if (!updated) throw new Error("Failed to update batch");
    await pharmacyRepository.logAudit(
      {
        action:
          status === "blocked"
            ? "batch_blocked"
            : status === "expired"
              ? "medicine_marked_expired"
              : "batch_unblocked",
        actor: { id: ctx.userId, name: ctx.userId, role: ctx.role },
        stockId,
        medicineId: batch.medicineId,
        detail: { reason, prevStatus: batch.status, newStatus: status },
      },
      ctx
    );
    return updated;
  }

  async getSummary(hospitalId: string, ctx: AccessContext): Promise<MedicineInventorySummary[]> {
    assertPermission(ctx, "VIEW_PHARMACY_DASHBOARD");
    const batches = await pharmacyRepository.findStockByHospital(hospitalId, ctx);
    const thresholds = await pharmacyRepository.listThresholds(hospitalId, ctx);
    const byMedicine = new Map<string, { medicineId: string; medicineName: string; batches: MedicineStockBatch[] }>();
    for (const b of batches) {
      const key = b.medicineId;
      const group =
        byMedicine.get(key) ?? {
          medicineId: key,
          medicineName: "",
          batches: [] as MedicineStockBatch[],
        };
      group.batches.push(b);
      byMedicine.set(key, group);
    }
    const medicineNames = new Map<string, string>();
    for (const g of byMedicine.values()) {
      const med = await pharmacyRepository.findMedicineById(g.medicineId);
      if (med) medicineNames.set(g.medicineId, med.name);
    }
    const summaries: MedicineInventorySummary[] = [];
    for (const group of byMedicine.values()) {
      let total = 0;
      for (const b of group.batches) {
        if (b.status === "available" || b.status === "depleted") total += b.quantity;
      }
      const minLevel = thresholds.find((t) => t.medicineId === group.medicineId)?.minLevel ?? 0;
      summaries.push({
        medicineId: group.medicineId,
        medicineName: medicineNames.get(group.medicineId) ?? group.medicineName,
        unit: group.batches[0]?.unit ?? "units",
        totalAvailable: total,
        minLevel,
        lowStock: minLevel > 0 && total < minLevel,
        batches: group.batches,
      });
    }
    return summaries.sort((a, b) => a.medicineName.localeCompare(b.medicineName));
  }

  async upsertThreshold(
    hospitalId: string,
    medicineId: string,
    minLevel: number,
    ctx: AccessContext
  ): Promise<InventoryConfig> {
    assertPermission(ctx, "MANAGE_PHARMACY_STOCK");
    if (minLevel < 0 || !Number.isFinite(minLevel)) throw new Error("minLevel must be >= 0");
    return pharmacyRepository.upsertThreshold(hospitalId, medicineId, minLevel, ctx);
  }

  async listThresholds(hospitalId: string, ctx: AccessContext): Promise<InventoryConfig[]> {
    assertPermission(ctx, "VIEW_PHARMACY_INVENTORY");
    return pharmacyRepository.listThresholds(hospitalId, ctx);
  }
}

export const inventoryService = new InventoryService();