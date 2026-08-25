"use server";

import "server-only";
import { dbConnect } from "@/lib/db";
import { 
  MedicineStockModel, 
  StockTransactionModel, 
  PrescriptionModel, 
  PrescriptionAuditModel,
  MedicineModel,
  CounterModel 
} from "@/lib/models";
import { getSession } from "@/lib/auth";

// Helper: atomic batch select FEFO
async function getBatchesForDispense(medicineId: string, hospitalId: string, quantityNeeded: number) {
  return await MedicineStockModel.find({
    medicineId,
    hospitalId,
    status: "available",
    quantity: { $gt: 0 }
  }).sort({ expiryDate: 1 }).lean();
}

export async function dispensePrescription(prescriptionId: string, items: { medicineId: string, qty: number }[]) {
  await dbConnect();
  const session = await getSession();
  const now = new Date().toISOString();
  
  // Start Session Transaction
  const sessionDb = await MedicineStockModel.startSession();
  sessionDb.startTransaction();

  try {
    const prescription = await PrescriptionModel.findById(prescriptionId).session(sessionDb);
    if (!prescription) throw new Error("Prescription not found");

    const dispensedBatches: { batchNumber: string, medicineId: string, qty: number }[] = [];
    let totalDispensed = 0;

    for (const item of items) {
      let remainingToDispense = item.qty;
      const batches = await getBatchesForDispense(item.medicineId, prescription.hospitalId, item.qty);

      for (const batch of batches) {
        if (remainingToDispense <= 0) break;
        
        const take = Math.min(remainingToDispense, batch.quantity);
        
        await MedicineStockModel.findByIdAndUpdate(batch._id, { $inc: { quantity: -take } }, { session: sessionDb });
        await StockTransactionModel.create([{
          stockId: batch._id,
          medicineId: item.medicineId,
          hospitalId: prescription.hospitalId,
          type: "dispensed",
          delta: -take,
          balanceAfter: batch.quantity - take,
          prescriptionId,
          by: session?.id,
          at: now
        }], { session: sessionDb });

        dispensedBatches.push({ batchNumber: batch.batchNumber, medicineId: item.medicineId, qty: take });
        remainingToDispense -= take;
        totalDispensed += take;
      }
      
      if (remainingToDispense > 0) throw new Error(`Insufficient stock for ${item.medicineId}`);
    }

    // Update prescription
    prescription.status = totalDispensed === prescription.totalItems ? "dispensed" : "partially_dispensed";
    prescription.dispensedItems = [...(prescription.dispensedItems || []), ...dispensedBatches];
    await prescription.save({ session: sessionDb });

    await PrescriptionAuditModel.create([{
      prescriptionId,
      action: "DISPENSED",
      actorId: session?.id,
      detail: { dispensedBatches, totalDispensed },
      createdAt: now
    }], { session: sessionDb });

    await sessionDb.commitTransaction();
    return { success: true, status: prescription.status };
  } catch (err) {
    await sessionDb.abortTransaction();
    throw err;
  } finally {
    sessionDb.endSession();
  }
}

export async function listStock(hospitalId: string) {
    await dbConnect();
    return await MedicineStockModel.find({ hospitalId }).populate('medicineId').lean();
}

export async function getLowStockAlerts(hospitalId: string) {
    await dbConnect();
    // Logic: sum quantity per medicineId where quantity < minLevel
    // Placeholder - requires InventoryConfigModel integration
    return [];
}
