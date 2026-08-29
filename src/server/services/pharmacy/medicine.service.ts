"use server";

import "server-only";
import { pharmacyRepository } from "@/server/repositories/pharmacy.repository";
import type { AccessContext } from "@/server/lib/access-context";
import { assertPermission } from "@/server/lib/scope-access";
import type { Medicine } from "@/types";

export class MedicineService {
  async list(ctx: AccessContext, search?: string): Promise<Medicine[]> {
    assertPermission(ctx, "VIEW_PHARMACY_INVENTORY");
    return pharmacyRepository.listMedicines(ctx, search);
  }

  async getById(medicineId: string): Promise<Medicine | null> {
    return pharmacyRepository.findMedicineById(medicineId);
  }

  async create(
    data: { name: string; genericName?: string; strength?: string; dosageForm?: string; unit: string },
    ctx: AccessContext
  ): Promise<Medicine> {
    assertPermission(ctx, "MANAGE_PHARMACY_STOCK");
    const medicine = await pharmacyRepository.createMedicine(data);
    await pharmacyRepository.logAudit(
      {
        action: "medicine_created",
        actor: { id: ctx.userId, name: ctx.userId, role: ctx.role },
        medicineId: medicine.id,
        detail: { name: data.name, unit: data.unit },
      },
      ctx
    );
    return medicine;
  }
}

export const medicineService = new MedicineService();