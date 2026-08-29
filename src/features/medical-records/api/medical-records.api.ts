import {
  getPatientProfile,
  getPatientSummary,
  searchPatients as serverSearchPatients,
  listPatientEncounters,
  getEncounter,
  listAllergies,
  listConditions,
  listPrescriptions as serverListPrescriptions,
  listLabResults,
  listDocuments as serverListDocuments,
} from "@/server/actions/medical-records";
import type { Encounter, EncounterType, PatientGender } from "@/types";
import type { MedicalPrescription } from "@/server/repositories/medical-records.repository";
import type { DiagnosticResult } from "@/services/diagnostics/types";
import type { MedicalDocument as ServerMedicalDocument } from "@/services/medical-documents/types";
import type {
  HistoryFilters,
  PatientEncounter,
  PatientHistoryView,
  PatientProfileView,
  DoctorPatientView,
  EncounterDetail,
  Prescription,
  MedicineItem,
  LabReport,
  LabResult,
  MedicalDocument,
  MedicalSummary,
  HistoryFacets,
  Page,
  AllergySeverity,
  VisitType,
} from "../types/medical-record.types";

/* ──────────────────────────── helpers ──────────────────────────── */

function toAge(dateOfBirth?: string): number {
  if (!dateOfBirth) return 0;
  const dob = new Date(dateOfBirth);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return age;
}

function toGender(g?: string): PatientGender {
  if (g === "male" || g === "female") return g;
  return "other";
}

const encounterTypeToVisitType: Record<EncounterType, VisitType> = {
  opd: "consultation",
  emergency: "consultation",
  follow_up: "follow-up",
  diagnostic: "consultation",
  other: "consultation",
};

function mapEncounterToPatientEncounter(enc: Encounter): PatientEncounter {
  return {
    id: enc.id,
    patientId: enc.patientId,
    hospitalId: enc.hospitalId,
    hospitalName: enc.hospitalName ?? "",
    departmentId: enc.departmentId ?? "",
    departmentName: enc.departmentName ?? "",
    doctorId: enc.doctorId ?? "",
    doctorName: enc.doctorName ?? "",
    date: enc.date,
    reason: "",
    visitType: enc.type ? encounterTypeToVisitType[enc.type] ?? "consultation" : "consultation",
    status: enc.status,
    createdAt: enc.createdAt,
  };
}

function mapServerAllergy(a: import("@/types").Allergy): import("../types/medical-record.types").Allergy {
  return {
    id: a.id,
    patientId: a.patientId,
    substance: a.substance,
    reaction: a.reaction,
    severity: a.severity as AllergySeverity | undefined,
    status: a.status === "active" ? "active" : "inactive",
  };
}

function mapServerCondition(c: import("@/types").Condition): import("../types/medical-record.types").Condition {
  return {
    id: c.id,
    patientId: c.patientId,
    name: c.name,
    status: c.status,
    since: c.diagnosedAt,
  };
}

function mapPrescriptionToVM(p: MedicalPrescription, encounterLookup: Map<string, Encounter>): Prescription {
  const enc = encounterLookup.get(p.encounterId);
  const medicines: MedicineItem[] = (p.items ?? []).map((item) => ({
    name: item.medicineName,
    dosage: item.dosage ?? "",
    frequency: item.frequency ?? "",
    duration: item.duration ?? "",
  }));
  return {
    id: p.id,
    patientId: p.patientId,
    encounterId: p.encounterId,
    issuedAt: (p.createdAt ?? "").slice(0, 10) || (p.finalizedAt ?? "").slice(0, 10) || "",
    hospitalName: enc?.hospitalName ?? "",
    departmentName: enc?.departmentName ?? "",
    doctorName: enc?.doctorName ?? "",
    medicines,
    instructions: p.instructions,
    status: p.status === "pending" ? "active" : (p.status as Prescription["status"]),
  };
}

function mapLabResultToLabReport(r: DiagnosticResult, orderLookup: Map<string, Encounter>): LabReport {
  const encounter = orderLookup.get(r.orderId);
  const results: LabResult[] = (r.values ?? []).map((v) => ({
    name: v.name,
    value: v.value,
    unit: v.unit,
    range: v.refText,
  }));
  return {
    id: r.id,
    patientId: r.patientId,
    encounterId: encounter?.id ?? "",
    name: r.testName ?? "",
    labName: "",
    hospitalName: encounter?.hospitalName ?? "",
    collectedAt: (r.createdAt ?? "").slice(0, 10),
    reportedAt: (r.publishedAt ?? r.verifiedAt ?? r.finalizedAt ?? r.createdAt ?? "").slice(0, 10),
    status: r.status === "published" || r.status === "verified" ? "completed" : "pending",
    results: results.length > 0 ? results : undefined,
  };
}

function mapDocumentToVM(d: ServerMedicalDocument): MedicalDocument {
  return {
    id: d.id,
    patientId: d.patientId,
    encounterId: d.encounterId ?? "",
    name: d.title,
    type: d.type as MedicalDocument["type"],
    date: (d.documentDate ?? d.createdAt ?? "").slice(0, 10),
    hospitalName: d.hospitalName ?? "",
    storageKey: d.fileId,
    uploadedAt: d.createdAt,
  };
}

function sortDesc(a: PatientEncounter, b: PatientEncounter): number {
  return b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt);
}

function buildFacets(encounters: PatientEncounter[]): HistoryFacets {
  const years = [...new Set(encounters.map((e) => e.date.slice(0, 4)))].sort((a, b) => b.localeCompare(a));
  const hospitals: HistoryFacets["hospitals"] = [];
  const departments: HistoryFacets["departments"] = [];
  for (const e of encounters) {
    if (e.hospitalId && !hospitals.some((h) => h.id === e.hospitalId)) {
      hospitals.push({ id: e.hospitalId, name: e.hospitalName });
    }
    if (e.departmentId && !departments.some((d) => d.id === e.departmentId)) {
      departments.push({ id: e.departmentId, name: e.departmentName });
    }
  }
  return { years, hospitals, departments };
}

function buildMedicationsFromPrescriptions(
  patientId: string,
  prescriptions: MedicalPrescription[]
): import("../types/medical-record.types").Medication[] {
  const meds = new Map<string, import("../types/medical-record.types").Medication>();
  for (const p of prescriptions) {
    for (const item of p.items ?? []) {
      const key = `${item.medicineName}|${item.dosage}|${item.frequency}`;
      if (!meds.has(key)) {
        meds.set(key, {
          id: `med_${meds.size}`,
          patientId,
          name: item.medicineName,
          dosage: item.dosage ?? "",
          frequency: item.frequency ?? "",
          status: "active",
        });
      }
    }
  }
  return [...meds.values()];
}

function matchesFilters(encounter: PatientEncounter, filters: HistoryFilters): boolean {
  if (filters.year && encounter.date.slice(0, 4) !== filters.year) return false;
  if (filters.hospitalId && encounter.hospitalId !== filters.hospitalId) return false;
  if (filters.departmentId && encounter.departmentId !== filters.departmentId) return false;
  if (filters.keyword.trim()) {
    const needle = filters.keyword.trim().toLowerCase();
    const haystack = `${encounter.reason} ${encounter.departmentName} ${encounter.doctorName}`.toLowerCase();
    if (!haystack.includes(needle)) return false;
  }
  return true;
}

/* ──────────────────────── API adapter ──────────────────────────── */

export const medicalRecordsRealApi = {
  async getHistory(patientId: string): Promise<PatientHistoryView> {
    const [summary, encounters, serverAllergies, serverConditions, prescriptions] = await Promise.all([
      getPatientSummary(patientId),
      listPatientEncounters(patientId),
      listAllergies(patientId),
      listConditions(patientId),
      serverListPrescriptions(patientId),
    ]);

    const patientEncounters = encounters
      .filter((e) => canAccess(e.hospitalId, summary.registeredHospitalId))
      .map(mapEncounterToPatientEncounter)
      .sort(sortDesc);

    const allergies = serverAllergies.map(mapServerAllergy);
    const conditions = serverConditions.map(mapServerCondition);
    const medications = buildMedicationsFromPrescriptions(patientId, prescriptions);

    const medicalSummary: MedicalSummary = {
      patient: {
        id: summary.id,
        patientNumber: summary.patientNumber,
        name: summary.name,
        age: summary.age,
        gender: toGender(summary.gender),
        phone: summary.phone ?? "",
        bloodGroup: summary.bloodGroup,
        registeredHospitalId: summary.registeredHospitalId,
        knownInfo: summary.knownInfo,
      },
      totalVisits: patientEncounters.length,
      allergyCount: allergies.filter((a) => a.status === "active").length,
      activeConditionCount: conditions.filter((c) => c.status === "active").length,
      medicationCount: medications.filter((m) => m.status === "active").length,
      allergies,
      conditions,
      medications,
    };

    return {
      patient: medicalSummary.patient,
      summary: medicalSummary,
      encounters: patientEncounters,
      facets: buildFacets(patientEncounters),
    };
  },

  async listEncounters(
    patientId: string,
    filters: HistoryFilters,
    pageNumber: number,
    pageSize: number
  ): Promise<Page<PatientEncounter>> {
    const encounters = await listPatientEncounters(patientId);
    const mapped = encounters.map(mapEncounterToPatientEncounter).sort(sortDesc);
    const filtered = mapped.filter((e) => matchesFilters(e, filters));
    const total = filtered.length;
    const start = (pageNumber - 1) * pageSize;
    return { items: filtered.slice(start, start + pageSize), total, page: pageNumber, pageSize };
  },

  async getEncounterDetails(
    patientId: string,
    encounterId: string
  ): Promise<EncounterDetail | null> {
    let serverEncounter: Encounter;
    try {
      serverEncounter = await getEncounter(encounterId);
    } catch {
      return null;
    }

    if (!serverEncounter || serverEncounter.patientId !== patientId) return null;

    const encounter = mapEncounterToPatientEncounter(serverEncounter);

    const [allPrescriptions, allLabResults] = await Promise.all([
      serverListPrescriptions(patientId),
      listLabResults(patientId),
    ]);

    const prescriptions = allPrescriptions
      .filter((p) => p.encounterId === encounterId)
      .map((p) => {
        const medicines: MedicineItem[] = (p.items ?? []).map((item) => ({
          name: item.medicineName,
          dosage: item.dosage ?? "",
          frequency: item.frequency ?? "",
          duration: item.duration ?? "",
        }));
        return {
          id: p.id,
          patientId: p.patientId,
          encounterId: p.encounterId,
          issuedAt: (p.createdAt ?? "").slice(0, 10) || (p.finalizedAt ?? "").slice(0, 10) || "",
          hospitalName: encounter.hospitalName,
          departmentName: encounter.departmentName,
          doctorName: encounter.doctorName,
          medicines,
          instructions: p.instructions,
          status: p.status === "pending" ? "active" : (p.status as Prescription["status"]),
        } satisfies Prescription;
      });

    const labs: LabReport[] = allLabResults
      .filter((r) => r.orderId && r.patientId === patientId)
      .map((r) => ({
        id: r.id,
        patientId: r.patientId,
        encounterId,
        name: r.testName ?? "",
        labName: "",
        hospitalName: encounter.hospitalName,
        collectedAt: (r.createdAt ?? "").slice(0, 10),
        reportedAt: (r.publishedAt ?? r.verifiedAt ?? r.finalizedAt ?? r.createdAt ?? "").slice(0, 10),
        status: r.status === "published" || r.status === "verified" ? "completed" : "pending",
        results: (r.values ?? []).map((v) => ({
          name: v.name,
          value: v.value,
          unit: v.unit,
          range: v.refText,
        })),
      }));

    return {
      encounter,
      chiefComplaint: encounter.reason,
      clinicalNotes: {
        chiefComplaint: encounter.reason,
        history: "",
        examination: "",
        assessment: "",
        plan: "",
      },
      summary: "",
      plan: "",
      diagnosis: null,
      prescriptions,
      labs,
      followUp: null,
    };
  },

  async listPrescriptions(
    patientId: string,
    pageNumber: number,
    pageSize: number
  ): Promise<Page<Prescription>> {
    const prescriptions = await serverListPrescriptions(patientId);
    const encounters = await listPatientEncounters(patientId);
    const encounterLookup = new Map(encounters.map((e) => [e.id, e]));

    const sorted = prescriptions
      .map((p) => mapPrescriptionToVM(p, encounterLookup))
      .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));

    const total = sorted.length;
    const start = (pageNumber - 1) * pageSize;
    return { items: sorted.slice(start, start + pageSize), total, page: pageNumber, pageSize };
  },

  async getPrescription(prescriptionId: string): Promise<Prescription | undefined> {
    return undefined;
  },

  async listLabReports(
    patientId: string,
    pageNumber: number,
    pageSize: number
  ): Promise<Page<LabReport>> {
    const results = await listLabResults(patientId);
    const encounters = await listPatientEncounters(patientId);
    const encounterLookup = new Map(encounters.map((e) => [e.id, e]));

    const mapped = results.map((r) => mapLabResultToLabReport(r, encounterLookup));
    const sorted = mapped.sort((a, b) => b.reportedAt.localeCompare(a.reportedAt));
    const total = sorted.length;
    const start = (pageNumber - 1) * pageSize;
    return { items: sorted.slice(start, start + pageSize), total, page: pageNumber, pageSize };
  },

  async getLabReport(reportId: string): Promise<LabReport | undefined> {
    return undefined;
  },

  async listDocuments(patientId: string): Promise<MedicalDocument[]> {
    const docs = await serverListDocuments(patientId);
    return docs.map(mapDocumentToVM).sort((a, b) => b.date.localeCompare(a.date));
  },

  async getProfile(patientId: string): Promise<PatientProfileView> {
    const [patient, serverAllergies, serverConditions, prescriptions] = await Promise.all([
      getPatientProfile(patientId),
      listAllergies(patientId),
      listConditions(patientId),
      serverListPrescriptions(patientId),
    ]);

    const allergies = serverAllergies.map(mapServerAllergy);
    const conditions = serverConditions.map(mapServerCondition);
    const medications = buildMedicationsFromPrescriptions(patientId, prescriptions);

    const address = patient.address
      ? [patient.address.line1, patient.address.line2, patient.address.district, patient.address.state]
          .filter(Boolean)
          .join(", ")
      : undefined;

    return {
      id: patient.id,
      name: patient.identity.name,
      age: toAge(patient.identity.dateOfBirth),
      gender: patient.identity.gender ?? "other",
      phone: patient.contact.mobile ?? "",
      bloodGroup: patient.bloodGroup,
      dateOfBirth: patient.identity.dateOfBirth,
      email: patient.contact.email,
      address,
      emergencyContact: patient.emergencyContact
        ? {
            name: patient.emergencyContact.name ?? "",
            relation: patient.emergencyContact.relationship ?? "",
            phone: patient.emergencyContact.mobile ?? "",
          }
        : undefined,
      languagePreference: "English",
      allergies,
      conditions,
      medications,
    };
  },

  async getDoctorPatientView(patientId: string): Promise<DoctorPatientView | null> {
    try {
      const [summary, encounters, serverAllergies, serverConditions, prescriptions] = await Promise.all([
        getPatientSummary(patientId),
        listPatientEncounters(patientId),
        listAllergies(patientId),
        listConditions(patientId),
        serverListPrescriptions(patientId),
      ]);

      const patientEncounters = encounters
        .filter((e) => canAccess(e.hospitalId, summary.registeredHospitalId))
        .map(mapEncounterToPatientEncounter)
        .sort(sortDesc);

      const allergies = serverAllergies.map(mapServerAllergy);
      const conditions = serverConditions.map(mapServerCondition);
      const medications = buildMedicationsFromPrescriptions(patientId, prescriptions);

      const medicalSummary: MedicalSummary = {
        patient: {
          id: summary.id,
          patientNumber: summary.patientNumber,
          name: summary.name,
          age: summary.age,
          gender: toGender(summary.gender),
          phone: summary.phone ?? "",
          bloodGroup: summary.bloodGroup,
          registeredHospitalId: summary.registeredHospitalId,
          knownInfo: summary.knownInfo,
        },
        totalVisits: patientEncounters.length,
        allergyCount: allergies.filter((a) => a.status === "active").length,
        activeConditionCount: conditions.filter((c) => c.status === "active").length,
        medicationCount: medications.filter((m) => m.status === "active").length,
        allergies,
        conditions,
        medications,
      };

      return {
        patient: medicalSummary.patient,
        summary: medicalSummary,
        encounters: patientEncounters,
        facets: buildFacets(patientEncounters),
      };
    } catch {
      return null;
    }
  },

  async searchPatients(query: string, _hospitalId?: string): Promise<PatientEncounter[]> {
    const q = query.trim();
    if (!q) return [];
    const results = await serverSearchPatients(q);
    return results.map((p) => ({
      id: p.id,
      patientId: p.id,
      hospitalId: p.registeredHospitalId,
      hospitalName: "",
      departmentId: "",
      departmentName: "",
      doctorId: "",
      doctorName: "",
      date: "",
      reason: "",
      visitType: "consultation" as const,
      status: "completed" as const,
      createdAt: "",
    }));
  },
};

function canAccess(recordHospitalId: string, registeredHospitalId: string): boolean {
  if (!registeredHospitalId) return true;
  return recordHospitalId === registeredHospitalId;
}
