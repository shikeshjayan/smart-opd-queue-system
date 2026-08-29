"use server";

import "server-only";
import { dbConnect } from "@/lib/db";
import {
  prescriptionRepository,
  labRepository,
  documentRepository,
} from "@/server/repositories/medical-records.repository";
import { DiagnosticResultModel, DocumentMetaModel, plain } from "@/lib/models";
import type { AccessContext } from "@/server/lib/access-context";
import type { RecordVisibility } from "@/types";
import type { MedicalPrescription } from "@/server/repositories/medical-records.repository";
import type { DiagnosticOrder, DiagnosticResult } from "@/services/diagnostics/types";
import type { MedicalDocument } from "@/services/medical-documents/types";

export class PrescriptionService {
  async listByPatient(patientId: string, ctx: AccessContext): Promise<MedicalPrescription[]> {
    return prescriptionRepository.findByPatient(patientId, ctx, 50);
  }

  async listByEncounter(encounterId: string, ctx: AccessContext): Promise<MedicalPrescription[]> {
    return prescriptionRepository.findByEncounter(encounterId, ctx);
  }

  async issue(
    encounterId: string,
    input: {
      patientId: string;
      doctorId: string;
      hospitalId: string;
      items: MedicalPrescription["items"];
      status?: string;
    },
    ctx: AccessContext
  ): Promise<MedicalPrescription> {
    return prescriptionRepository.create({ ...input, encounterId }, ctx);
  }
}

export const prescriptionService = new PrescriptionService();

export class LabService {
  async listOrders(patientId: string, ctx: AccessContext): Promise<DiagnosticOrder[]> {
    return labRepository.findOrdersByPatient(patientId, ctx);
  }

  async listResults(patientId: string, ctx: AccessContext): Promise<DiagnosticResult[]> {
    return labRepository.findResultsByPatient(patientId, ctx);
  }

  async resultsByOrder(orderId: string, ctx: AccessContext): Promise<DiagnosticResult[]> {
    return labRepository.findResultsByOrder(orderId, ctx);
  }
}

export const labService = new LabService();

export class DocumentRecordService {
  async listByPatient(patientId: string, ctx: AccessContext): Promise<MedicalDocument[]> {
    return documentRepository.findByPatient(patientId, ctx);
  }

  async listByEncounter(encounterId: string, ctx: AccessContext): Promise<MedicalDocument[]> {
    return documentRepository.findByEncounter(encounterId, ctx);
  }

  /** Release workflow (WS 28.6): control patient-facing visibility. */
  async setVisibility(
    kind: "document" | "result",
    id: string,
    visibility: RecordVisibility,
    ctx: AccessContext
  ): Promise<{ id: string; visibility: RecordVisibility; releasedAt: string | null }> {
    await dbConnect();
    const now = new Date().toISOString();
    let doc: any = null;

    if (kind === "document") {
      doc = await DocumentMetaModel.findByIdAndUpdate(
        id,
        {
          $set: {
            visibility,
            releasedAt: visibility === "released" ? now : undefined,
          },
        },
        { new: true }
      ).lean();
    } else {
      doc = await DiagnosticResultModel.findByIdAndUpdate(
        id,
        {
          $set: {
            visibility,
            publishedAt: visibility === "released" ? now : undefined,
          },
        },
        { new: true }
      ).lean();
    }

    if (!doc) throw new Error(`${kind} not found`);
    return {
      id: String(doc._id),
      visibility,
      releasedAt: visibility === "released" ? now : null,
    };
  }
}

export const documentRecordService = new DocumentRecordService();