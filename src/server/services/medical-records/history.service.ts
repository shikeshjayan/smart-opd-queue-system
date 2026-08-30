
import "server-only";
import {
  patientRepository,
  encounterRepository,
  allergyRepository,
  conditionRepository,
  vitalSignsRepository,
  prescriptionRepository,
  labRepository,
  documentRepository,
  correctionRequestRepository,
  breakGlassRepository,
  type CursorPage,
} from "@/server/repositories/medical-records.repository";
import type { AccessContext } from "@/server/lib/access-context";
import type { Encounter, Allergy, Condition, VitalSigns, BreakGlassRequest, CorrectionRequest } from "@/types";
import type { MedicalPrescription } from "@/server/repositories/medical-records.repository";
import { canAccessPatientRecordFromHospital } from "@/server/lib/scope-access";

/* ---------- History timeline DTOs ---------- */

export type TimelineEntryType =
  | "encounter"
  | "prescription"
  | "lab_result"
  | "diagnostic_report"
  | "document"
  | "allergy"
  | "condition"
  | "vitals";

export type TimelineEntry = {
  id: string;
  type: TimelineEntryType;
  date: string;
  title: string;
  subtitle?: string;
  hospitalId?: string;
  hospitalName?: string;
  departmentName?: string;
  doctorName?: string;
};

export type HistoryFilters = {
  dateFrom?: string;
  dateTo?: string;
  hospitalId?: string;
  recordType?: TimelineEntryType;
  limit?: number;
};

export class HistoryService {
  async getTimeline(
    patientId: string,
    filters: HistoryFilters,
    ctx: AccessContext
  ): Promise<CursorPage<TimelineEntry>> {
    const patient = await patientRepository.findById(patientId, ctx);
    if (!patient) throw new Error("Patient not found");

    const limit = filters.limit ?? 20;
    const entries: TimelineEntry[] = [];

    const filterDate = (d?: string) => {
      if (!d) return true;
      if (filters.dateFrom && d < filters.dateFrom) return false;
      if (filters.dateTo && d > filters.dateTo) return false;
      return true;
    };

    if (!filters.recordType || filters.recordType === "encounter") {
      const encounters = await encounterRepository.findByPatient(patientId, ctx);
      for (const e of encounters) {
        if (filters.hospitalId && e.hospitalId !== filters.hospitalId) continue;
        if (!filterDate(e.date)) continue;
        if (!canAccessPatientRecordFromHospital(ctx, e.hospitalId)) continue;
        entries.push({
          id: e.id,
          type: "encounter",
          date: e.date,
          title: e.departmentName ?? "Consultation",
          subtitle: e.doctorName,
          hospitalId: e.hospitalId,
          hospitalName: e.hospitalName,
          departmentName: e.departmentName,
          doctorName: e.doctorName,
        });
      }
    }

    if (!filters.recordType || filters.recordType === "prescription") {
      const prescriptions = await prescriptionRepository.findByPatient(patientId, ctx, 30);
      for (const p of prescriptions) {
        if (filters.hospitalId && p.hospitalId !== filters.hospitalId) continue;
        if (!filterDate((p.createdAt ?? "").slice(0, 10))) continue;
        entries.push({
          id: p.id,
          type: "prescription",
          date: (p.createdAt ?? "").slice(0, 10) || p.finalizedAt?.slice(0, 10) || "",
          title: "Prescription",
          subtitle: (p.items ?? []).map((i: { medicineName?: string }) => i.medicineName ?? "").slice(0, 3).join(", "),
          hospitalId: p.hospitalId,
        });
      }
    }

    if (!filters.recordType || filters.recordType === "lab_result" || filters.recordType === "diagnostic_report") {
      const results = await labRepository.findResultsByPatient(patientId, ctx);
      for (const r of results) {
        if (!filterDate((r.createdAt ?? "").slice(0, 10))) continue;
        entries.push({
          id: r.id,
          type: "lab_result",
          date: (r.createdAt ?? "").slice(0, 10),
          title: r.testName ?? "Lab Result",
          subtitle: r.category,
          doctorName: r.reportedByName,
        });
      }
    }

    if (!filters.recordType || filters.recordType === "document") {
      const docs = await documentRepository.findByPatient(patientId, ctx);
      for (const d of docs) {
        if (!filterDate((d.createdAt ?? "").slice(0, 10))) continue;
        entries.push({
          id: d.id,
          type: "document",
          date: (d.createdAt ?? "").slice(0, 10),
          title: d.title ?? d.type,
          subtitle: d.departmentName,
          hospitalName: d.hospitalName,
        });
      }
    }

    entries.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

    const startIndex = 0;
    const page = entries.slice(startIndex, startIndex + limit);

    return {
      items: page,
      nextCursor: entries.length > startIndex + limit ? page[page.length - 1]?.date ?? null : null,
      hasMore: entries.length > startIndex + limit,
    };
  }

  async overview(patientId: string, ctx: AccessContext): Promise<{
    allergies: Allergy[];
    conditions: Condition[];
    recentEncounters: Encounter[];
    latestVitals: VitalSigns | null;
    prescriptions: MedicalPrescription[];
  }> {
    const [allergies, conditions, encounters, vitals, prescriptions] = await Promise.all([
      this.getAllergies(patientId, ctx),
      this.getConditions(patientId, ctx),
      this.getRecentEncounters(patientId, ctx, 5),
      this.getLatestVitals(patientId, ctx),
      prescriptionRepository.findByPatient(patientId, ctx, 10),
    ]);

    return { allergies, conditions, recentEncounters: encounters, latestVitals: vitals, prescriptions };
  }

  async getAllergies(patientId: string, ctx: AccessContext): Promise<Allergy[]> {
    return allergyRepository.findByPatient(patientId, ctx);
  }

  async getConditions(patientId: string, ctx: AccessContext): Promise<Condition[]> {
    return conditionRepository.findByPatient(patientId, ctx);
  }

  async getRecentEncounters(patientId: string, ctx: AccessContext, limit = 5): Promise<Encounter[]> {
    const encounters = await encounterRepository.findByPatient(patientId, ctx);
    return encounters
      .filter((e) => canAccessPatientRecordFromHospital(ctx, e.hospitalId))
      .slice(0, limit);
  }

  async getLatestVitals(patientId: string, ctx: AccessContext): Promise<VitalSigns | null> {
    return vitalSignsRepository.findLatest(patientId, ctx);
  }
}

export const historyService = new HistoryService();

export class AccessService {
  async requestBreakGlass(patientId: string, reason: string, ctx: AccessContext): Promise<BreakGlassRequest> {
    const requesterName = ctx.userId;
    return breakGlassRepository.create({
      patientId,
      requestorId: ctx.userId,
      requestorName: requesterName,
      requestorRole: ctx.role,
      reason,
      hospitalId: ctx.hospitalIds[0] ?? "",
    });
  }

  async hasBreakGlass(patientId: string, ctx: AccessContext): Promise<boolean> {
    const active = await breakGlassRepository.findActive(patientId, ctx.userId);
    return !!active;
  }

  async requestCorrection(
    patientId: string,
    input: {
      targetType: CorrectionRequest["targetType"];
      targetId?: string;
      requestedChanges: CorrectionRequest["requestedChanges"];
      reason?: string;
    },
    ctx: AccessContext
  ): Promise<CorrectionRequest> {
    return correctionRequestRepository.create({ patientId, requestorId: ctx.userId, ...input });
  }

  async listCorrections(patientId: string, ctx: AccessContext): Promise<CorrectionRequest[]> {
    return correctionRequestRepository.findByPatient(patientId, ctx);
  }
}

export const accessService = new AccessService();