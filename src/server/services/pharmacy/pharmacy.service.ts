
import "server-only";
import type { AccessContext } from "@/server/lib/access-context";
import type { DispenseLineInput, DispenseOutcome, MedicineStockBatch } from "@/services/pharmacy/types";
import { dispensingService } from "@/server/services/pharmacy/dispensing.service";
import { inventoryService } from "@/server/services/pharmacy/inventory.service";

export class PharmacyService {
  async dispensePrescription(
    prescriptionId: string,
    hospitalId: string,
    items: DispenseLineInput[],
    ctx: AccessContext
  ): Promise<DispenseOutcome> {
    return dispensingService.dispensePrescription(prescriptionId, hospitalId, items, ctx);
  }

  async getInventorySummary(hospitalId: string, ctx: AccessContext): Promise<MedicineStockBatch[]> {
    return inventoryService.listBatches(hospitalId, ctx);
  }
}

export const pharmacyService = new PharmacyService();