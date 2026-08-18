import type {
  Allergy,
  Condition,
  DoctorPatientView,
  EncounterDetail,
  HistoryFacets,
  HistoryFilters,
  LabReport,
  MedicalDocument,
  MedicalSummary,
  Medication,
  Page,
  PatientEncounter,
  PatientHistoryView,
  PatientProfileView,
  Prescription,
  VisitType,
} from "@/features/medical-records/types/medical-record.types";
import { getPatient } from "../data";

const delay = () => new Promise((resolve) => setTimeout(resolve, 300));

const PATIENT_ID = "P10294";

const encounterSeeds: Omit<PatientEncounter, "hospitalName" | "departmentName" | "visitType">[] =
  [
    {
      id: "MR20260816001",
      patientId: PATIENT_ID,
      hospitalId: "hos_001",
      departmentId: "dep_001",
      doctorId: "doc_001",
      doctorName: "Dr. Anil Kumar",
      date: "2026-08-16",
      reason: "Chest discomfort since morning",
      status: "completed",
      createdAt: "2026-08-16T10:05:00",
    },
    {
      id: "MR20260810001",
      patientId: PATIENT_ID,
      hospitalId: "hos_001",
      departmentId: "dep_002",
      doctorId: "doc_002",
      doctorName: "Dr. Geetha Nair",
      date: "2026-08-10",
      reason: "Fever and headache",
      status: "completed",
      createdAt: "2026-08-10T09:15:00",
    },
    {
      id: "MR20260602001",
      patientId: PATIENT_ID,
      hospitalId: "hos_005",
      departmentId: "dep_011",
      doctorId: "doc_005",
      doctorName: "Dr. Suresh Pillai",
      date: "2026-06-02",
      reason: "Recurrent chest tightness on exertion",
      status: "completed",
      createdAt: "2026-06-02T10:20:00",
    },
    {
      id: "MR20260418001",
      patientId: PATIENT_ID,
      hospitalId: "hos_006",
      departmentId: "dep_014",
      doctorId: "doc_008",
      doctorName: "Dr. Meenakshi Warrier",
      date: "2026-04-18",
      reason: "Blood sugar review",
      status: "completed",
      createdAt: "2026-04-18T11:30:00",
    },
    {
      id: "MR20260112001",
      patientId: PATIENT_ID,
      hospitalId: "hos_001",
      departmentId: "dep_001",
      doctorId: "doc_001",
      doctorName: "Dr. Anil Kumar",
      date: "2026-01-12",
      reason: "Routine review",
      status: "completed",
      createdAt: "2026-01-12T11:00:00",
    },
    {
      id: "MR20251204001",
      patientId: PATIENT_ID,
      hospitalId: "hos_005",
      departmentId: "dep_011",
      doctorId: "doc_005",
      doctorName: "Dr. Suresh Pillai",
      date: "2025-12-04",
      reason: "Seasonal cough and cold",
      status: "completed",
      createdAt: "2025-12-04T09:45:00",
    },
    {
      id: "MR20250721001",
      patientId: PATIENT_ID,
      hospitalId: "hos_001",
      departmentId: "dep_001",
      doctorId: "doc_001",
      doctorName: "Dr. Anil Kumar",
      date: "2025-07-21",
      reason: "Routine check-up",
      status: "completed",
      createdAt: "2025-07-21T10:40:00",
    },
  ];

const encounterExtras: Record<
  string,
  { visitType: VisitType; hospitalName: string; departmentName: string }
> = {
  MR20260816001: { visitType: "consultation", hospitalName: "Government Hospital Ernakulam", departmentName: "Cardiology" },
  MR20260810001: { visitType: "consultation", hospitalName: "Government Hospital Ernakulam", departmentName: "General Medicine" },
  MR20260602001: { visitType: "consultation", hospitalName: "Government Hospital Aluva", departmentName: "General Medicine" },
  MR20260418001: { visitType: "follow-up", hospitalName: "Government Hospital Perumbavoor", departmentName: "General Medicine" },
  MR20260112001: { visitType: "review", hospitalName: "Government Hospital Ernakulam", departmentName: "Cardiology" },
  MR20251204001: { visitType: "consultation", hospitalName: "Government Hospital Aluva", departmentName: "General Medicine" },
  MR20250721001: { visitType: "review", hospitalName: "Government Hospital Ernakulam", departmentName: "Cardiology" },
};

const encounters: PatientEncounter[] = encounterSeeds.map((seed) => {
  const extra = encounterExtras[seed.id];
  return { ...seed, visitType: extra.visitType, hospitalName: extra.hospitalName, departmentName: extra.departmentName };
});

const allergies: Allergy[] = [
  { id: "ALG001", patientId: PATIENT_ID, substance: "Penicillin", reaction: "Rash", severity: "moderate", status: "active" },
  { id: "ALG002", patientId: PATIENT_ID, substance: "Sulfa drugs", reaction: "Itching", severity: "mild", status: "active" },
];

const conditions: Condition[] = [
  { id: "CON001", patientId: PATIENT_ID, name: "Hypertension", status: "active", since: "2019" },
  { id: "CON002", patientId: PATIENT_ID, name: "Type 2 diabetes mellitus", status: "active", since: "2021" },
  { id: "CON003", patientId: PATIENT_ID, name: "Dyslipidaemia", status: "active", since: "2023" },
  { id: "CON004", patientId: PATIENT_ID, name: "Right wrist fracture", status: "resolved", since: "2019" },
];

const medications: Medication[] = [
  { id: "MED001", patientId: PATIENT_ID, name: "Metformin", dosage: "500 mg", frequency: "1-0-1", status: "active" },
  { id: "MED002", patientId: PATIENT_ID, name: "Amlodipine", dosage: "5 mg", frequency: "1-0-0", status: "active" },
  { id: "MED003", patientId: PATIENT_ID, name: "Atorvastatin", dosage: "10 mg", frequency: "0-1-0", status: "active" },
  { id: "MED004", patientId: PATIENT_ID, name: "Aspirin", dosage: "75 mg", frequency: "1-0-0", status: "active" },
];

const prescriptionSeeds: Prescription[] = [
  {
    id: "RX20260816001",
    patientId: PATIENT_ID,
    encounterId: "MR20260816001",
    issuedAt: "2026-08-16",
    hospitalName: "Government Hospital Ernakulam",
    departmentName: "Cardiology",
    doctorName: "Dr. Anil Kumar",
    medicines: [
      { name: "Aspirin", dosage: "75 mg", frequency: "1-0-0", duration: "30 days" },
      { name: "Atorvastatin", dosage: "10 mg", frequency: "0-1-0", duration: "30 days" },
    ],
    instructions: "Take once daily after food. Report chest pain immediately.",
    status: "active",
  },
  {
    id: "RX20260810001",
    patientId: PATIENT_ID,
    encounterId: "MR20260810001",
    issuedAt: "2026-08-10",
    hospitalName: "Government Hospital Ernakulam",
    departmentName: "General Medicine",
    doctorName: "Dr. Geetha Nair",
    medicines: [{ name: "Paracetamol", dosage: "650 mg", frequency: "1-1-1", duration: "3 days" }],
    instructions: "Rest and plenty of fluids. Review if fever persists.",
    status: "completed",
  },
  {
    id: "RX20260602001",
    patientId: PATIENT_ID,
    encounterId: "MR20260602001",
    issuedAt: "2026-06-02",
    hospitalName: "Government Hospital Aluva",
    departmentName: "General Medicine",
    doctorName: "Dr. Suresh Pillai",
    medicines: [
      { name: "Aspirin", dosage: "75 mg", frequency: "1-0-0", duration: "5 days" },
      { name: "Atorvastatin", dosage: "10 mg", frequency: "0-1-0", duration: "30 days" },
    ],
    instructions: "Referred to Cardiology, GH Ernakulam for further evaluation.",
    status: "completed",
  },
  {
    id: "RX20260418001",
    patientId: PATIENT_ID,
    encounterId: "MR20260418001",
    issuedAt: "2026-04-18",
    hospitalName: "Government Hospital Perumbavoor",
    departmentName: "General Medicine",
    doctorName: "Dr. Meenakshi Warrier",
    medicines: [{ name: "Metformin", dosage: "500 mg", frequency: "1-0-1", duration: "30 days" }],
    instructions: "Continue dietary modifications. Retest blood sugar in 2 weeks.",
    status: "active",
  },
  {
    id: "RX20260112001",
    patientId: PATIENT_ID,
    encounterId: "MR20260112001",
    issuedAt: "2026-01-12",
    hospitalName: "Government Hospital Ernakulam",
    departmentName: "Cardiology",
    doctorName: "Dr. Anil Kumar",
    medicines: [{ name: "Amlodipine", dosage: "5 mg", frequency: "1-0-0", duration: "180 days" }],
    instructions: "Monitor blood pressure at home. Review in 6 months.",
    status: "active",
  },
  {
    id: "RX20251204001",
    patientId: PATIENT_ID,
    encounterId: "MR20251204001",
    issuedAt: "2025-12-04",
    hospitalName: "Government Hospital Aluva",
    departmentName: "General Medicine",
    doctorName: "Dr. Suresh Pillai",
    medicines: [
      { name: "Cetirizine", dosage: "10 mg", frequency: "0-1-0", duration: "7 days" },
      { name: "Cough syrup", dosage: "5 ml", frequency: "1-1-1", duration: "5 days" },
    ],
    status: "completed",
  },
];

const labReportSeeds: LabReport[] = [
  {
    id: "LR20260816001",
    patientId: PATIENT_ID,
    encounterId: "MR20260816001",
    name: "Complete Blood Count",
    labName: "Government Hospital Laboratory",
    hospitalName: "Government Hospital Ernakulam",
    collectedAt: "2026-08-16",
    reportedAt: "2026-08-16",
    status: "completed",
    results: [
      { name: "Hemoglobin", value: "13.2", unit: "g/dL", range: "13.0 – 17.0" },
      { name: "WBC", value: "7600", unit: "/mm³", range: "4000 – 11000" },
      { name: "Platelets", value: "2.4", unit: "lakh/µL", range: "1.5 – 4.5" },
    ],
  },
  {
    id: "LR20260810001",
    patientId: PATIENT_ID,
    encounterId: "MR20260810001",
    name: "Complete Blood Count",
    labName: "Government Hospital Laboratory",
    hospitalName: "Government Hospital Ernakulam",
    collectedAt: "2026-08-10",
    reportedAt: "2026-08-10",
    status: "completed",
    results: [
      { name: "Hemoglobin", value: "13.6", unit: "g/dL", range: "13.0 – 17.0" },
      { name: "WBC", value: "9800", unit: "/mm³", range: "4000 – 11000" },
      { name: "Platelets", value: "2.6", unit: "lakh/µL", range: "1.5 – 4.5" },
    ],
  },
  {
    id: "LR20260602001",
    patientId: PATIENT_ID,
    encounterId: "MR20260602001",
    name: "Lipid Profile",
    labName: "Government Hospital Laboratory",
    hospitalName: "Government Hospital Aluva",
    collectedAt: "2026-06-02",
    reportedAt: "2026-06-05",
    status: "completed",
    results: [
      { name: "Total Cholesterol", value: "218", unit: "mg/dL", range: "< 200" },
      { name: "LDL", value: "152", unit: "mg/dL", range: "70 – 130" },
      { name: "HDL", value: "38", unit: "mg/dL", range: "40 – 60" },
      { name: "Triglycerides", value: "165", unit: "mg/dL", range: "< 150" },
    ],
  },
  {
    id: "LR20260418001",
    patientId: PATIENT_ID,
    encounterId: "MR20260418001",
    name: "Fasting Blood Glucose",
    labName: "Government Hospital Laboratory",
    hospitalName: "Government Hospital Perumbavoor",
    collectedAt: "2026-04-18",
    reportedAt: "2026-04-18",
    status: "completed",
    results: [{ name: "Glucose (Fasting)", value: "168", unit: "mg/dL", range: "70 – 110" }],
  },
];

const documentSeeds: MedicalDocument[] = [
  {
    id: "DOC20260816001",
    patientId: PATIENT_ID,
    encounterId: "MR20260816001",
    name: "CBC Report — 16 Aug 2026",
    type: "lab_report",
    date: "2026-08-16",
    hospitalName: "Government Hospital Ernakulam",
    storageKey: "docs/2026/08/P10294-cbc.pdf",
    uploadedAt: "2026-08-16T12:10:00",
  },
  {
    id: "DOC20260816002",
    patientId: PATIENT_ID,
    encounterId: "MR20260816001",
    name: "ECG Report — 16 Aug 2026",
    type: "lab_report",
    date: "2026-08-16",
    hospitalName: "Government Hospital Ernakulam",
    storageKey: "docs/2026/08/P10294-ecg.pdf",
    uploadedAt: "2026-08-16T12:15:00",
  },
  {
    id: "DOC20260602001",
    patientId: PATIENT_ID,
    encounterId: "MR20260602001",
    name: "Referral Letter — Cardiology",
    type: "referral",
    date: "2026-06-02",
    hospitalName: "Government Hospital Aluva",
    storageKey: "docs/2026/06/P10294-referral.pdf",
    uploadedAt: "2026-06-02T12:00:00",
  },
  {
    id: "DOC20260418001",
    patientId: PATIENT_ID,
    encounterId: "MR20260418001",
    name: "Prescription — Metformin (Apr 2026)",
    type: "prescription",
    date: "2026-04-18",
    hospitalName: "Government Hospital Perumbavoor",
    storageKey: "docs/2026/04/P10294-rx.pdf",
    uploadedAt: "2026-04-18T12:30:00",
  },
  {
    id: "DOC20260112001",
    patientId: PATIENT_ID,
    encounterId: "MR20260112001",
    name: "Routine Review Prescription",
    type: "prescription",
    date: "2026-01-12",
    hospitalName: "Government Hospital Ernakulam",
    storageKey: "docs/2026/01/P10294-review-rx.pdf",
    uploadedAt: "2026-01-12T12:20:00",
  },
  {
    id: "DOC20250210001",
    patientId: PATIENT_ID,
    encounterId: "",
    name: "Medical Certificate — Sick Leave",
    type: "medical_certificate",
    date: "2025-02-10",
    hospitalName: "Government Hospital Aluva",
    storageKey: "docs/2025/02/P10294-certificate.pdf",
    uploadedAt: "2025-02-10T11:00:00",
  },
  {
    id: "DOC20190420001",
    patientId: PATIENT_ID,
    encounterId: "",
    name: "Discharge Summary — Right Wrist Fracture",
    type: "discharge_summary",
    date: "2019-04-20",
    hospitalName: "Government Hospital Ernakulam",
    storageKey: "docs/2019/04/P10294-discharge.pdf",
    uploadedAt: "2019-04-20T17:00:00",
  },
];

const diagnosisSeeds: Record<string, { id: string; name: string; status: "active" | "resolved" }> = {
  MR20260816001: { id: "DG001", name: "Suspected stable angina", status: "active" },
  MR20260810001: { id: "DG002", name: "Viral fever", status: "resolved" },
  MR20260602001: { id: "DG003", name: "Angina pectoris (suspected)", status: "active" },
  MR20260418001: { id: "DG004", name: "Type 2 diabetes mellitus", status: "active" },
  MR20260112001: { id: "DG005", name: "Hypertension", status: "active" },
  MR20251204001: { id: "DG006", name: "Acute upper respiratory infection", status: "resolved" },
  MR20250721001: { id: "DG007", name: "Hypertension — controlled", status: "active" },
};

const planSeeds: Record<string, string> = {
  MR20260816001:
    "Start antiplatelet and statin therapy. Repeat lipid profile. Cardiology follow-up after 2 weeks.",
  MR20260810001: "Paracetamol as needed, rest, fluids. Review if fever persists beyond 3 days.",
  MR20260602001: "Ordered lipid profile. Referred to Cardiology, GH Ernakulam for further evaluation.",
  MR20260418001: "Continue Metformin. Dietary review with nutrition counselling.",
  MR20260112001: "Continue current medications. Review blood pressure and lipid profile in 6 months.",
  MR20251204001: "Antihistamine and cough syrup as prescribed. Increase fluid intake.",
  MR20250721001: "Continue current regimen. Annual cardiac review.",
};

const summarySeeds: Record<string, string> = {
  MR20260816001:
    "BP 138/86, pulse 78 regular. ECG showed no acute ischaemic changes. Chest discomfort on exertion.",
  MR20260810001: "Temperature 99.5 F, throat congested. Examination otherwise unremarkable.",
  MR20260602001: "Pain on exertion, relieved by rest. BP 142/90. No similar episode at rest.",
  MR20260418001: "Fasting glucose 168 mg/dL. No features of hypoglycaemia. BP 132/84.",
  MR20260112001: "BP 135/85. Asymptomatic. Adherent to current regimen.",
  MR20251204001: "Productive cough with mild nasal congestion. Mild fever on first day.",
  MR20250721001: "BP 128/82. Routine parameters within limits.",
};

const followUpSeeds: Record<string, string> = {
  MR20260816001: "Review after 2 weeks.",
  MR20260602001: "Cardiology review at GH Ernakulam after referral.",
  MR20260418001: "Retest blood sugar after 2 weeks.",
  MR20260112001: "Review in 6 months.",
  MR20250721001: "Annual review.",
};

function sortDesc(a: PatientEncounter, b: PatientEncounter): number {
  return b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt);
}

function encountersFor(patientId: string): PatientEncounter[] {
  return encounters.filter((e) => e.patientId === patientId).sort(sortDesc);
}

function buildFacets(patientId: string): HistoryFacets {
  const list = encountersFor(patientId);
  const years = [...new Set(list.map((e) => e.date.slice(0, 4)))].sort((a, b) => b.localeCompare(a));
  const hospitals: HistoryFacets["hospitals"] = [];
  const departments: HistoryFacets["departments"] = [];
  for (const e of list) {
    if (!hospitals.some((h) => h.id === e.hospitalId)) hospitals.push({ id: e.hospitalId, name: e.hospitalName });
    if (!departments.some((d) => d.id === e.departmentId)) {
      departments.push({ id: e.departmentId, name: e.departmentName });
    }
  }
  return { years, hospitals, departments };
}

function buildSummary(patientId: string): MedicalSummary {
  const patient = getPatient(patientId);
  const list = encountersFor(patientId);
  return {
    patient: patient ?? { id: patientId, name: "Unknown Patient", age: 0, gender: "other", phone: "", registeredHospitalId: "", knownInfo: { allergies: [], medications: [], conditions: [] } },
    totalVisits: list.length,
    allergyCount: allergies.filter((a) => a.patientId === patientId && a.status === "active").length,
    activeConditionCount: conditions.filter((c) => c.patientId === patientId && c.status === "active").length,
    medicationCount: medications.filter((m) => m.patientId === patientId && m.status === "active").length,
    allergies: allergies.filter((a) => a.patientId === patientId),
    conditions: conditions.filter((c) => c.patientId === patientId),
    medications: medications.filter((m) => m.patientId === patientId),
  };
}

function matchesFilters(encounter: PatientEncounter, filters: HistoryFilters): boolean {
  if (filters.year && encounter.date.slice(0, 4) !== filters.year) return false;
  if (filters.hospitalId && encounter.hospitalId !== filters.hospitalId) return false;
  if (filters.departmentId && encounter.departmentId !== filters.departmentId) return false;
  if (filters.keyword.trim()) {
    const needle = filters.keyword.trim().toLowerCase();
    const diagnosisName = diagnosisSeeds[encounter.id]?.name ?? "";
    const haystack = `${encounter.reason} ${encounter.departmentName} ${encounter.doctorName} ${diagnosisName}`.toLowerCase();
    if (!haystack.includes(needle)) return false;
  }
  return true;
}

export const medicalRecordsService = {
  async getHistory(patientId: string): Promise<PatientHistoryView> {
    await delay();
    return {
      patient: getPatient(patientId) ?? { id: patientId, name: "Unknown Patient", age: 0, gender: "other", phone: "", registeredHospitalId: "", knownInfo: { allergies: [], medications: [], conditions: [] } },
      summary: buildSummary(patientId),
      encounters: encountersFor(patientId),
      facets: buildFacets(patientId),
    };
  },

  async listEncounters(
    patientId: string,
    filters: HistoryFilters,
    pageNumber: number,
    pageSize: number
  ): Promise<Page<PatientEncounter>> {
    await delay();
    const filtered = encountersFor(patientId).filter((e) => matchesFilters(e, filters));
    const total = filtered.length;
    const start = (pageNumber - 1) * pageSize;
    return { items: filtered.slice(start, start + pageSize), total, page: pageNumber, pageSize };
  },

  async getEncounterDetails(patientId: string, encounterId: string): Promise<EncounterDetail | null> {
    await delay();
    const encounter = encounters.find((e) => e.id === encounterId && e.patientId === patientId);
    if (!encounter) return null;
    const diagnosis = diagnosisSeeds[encounterId];
    return {
      encounter,
      chiefComplaint: encounter.reason,
      summary: summarySeeds[encounterId] ?? "",
      plan: planSeeds[encounterId] ?? "",
      diagnosis: diagnosis ? { ...diagnosis } : null,
      prescriptions: prescriptionSeeds.filter((p) => p.encounterId === encounterId),
      labs: labReportSeeds.filter((l) => l.encounterId === encounterId),
      followUp: followUpSeeds[encounterId] ?? null,
    };
  },

  async listPrescriptions(patientId: string, pageNumber: number, pageSize: number): Promise<Page<Prescription>> {
    await delay();
    const sorted = prescriptionSeeds
      .filter((p) => p.patientId === patientId)
      .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
    const total = sorted.length;
    const start = (pageNumber - 1) * pageSize;
    return { items: sorted.slice(start, start + pageSize), total, page: pageNumber, pageSize };
  },

  async getPrescription(prescriptionId: string): Promise<Prescription | undefined> {
    await delay();
    return prescriptionSeeds.find((p) => p.id === prescriptionId);
  },

  async listLabReports(patientId: string, pageNumber: number, pageSize: number): Promise<Page<LabReport>> {
    await delay();
    const sorted = labReportSeeds
      .filter((l) => l.patientId === patientId)
      .sort((a, b) => b.reportedAt.localeCompare(a.reportedAt));
    const total = sorted.length;
    const start = (pageNumber - 1) * pageSize;
    return { items: sorted.slice(start, start + pageSize), total, page: pageNumber, pageSize };
  },

  async getLabReport(reportId: string): Promise<LabReport | undefined> {
    await delay();
    return labReportSeeds.find((l) => l.id === reportId);
  },

  async listDocuments(patientId: string): Promise<MedicalDocument[]> {
    await delay();
    return documentSeeds
      .filter((d) => d.patientId === patientId)
      .sort((a, b) => b.date.localeCompare(a.date));
  },

  async getProfile(patientId: string): Promise<PatientProfileView> {
    await delay();
    const patient = getPatient(patientId);
    return {
      id: patientId,
      name: patient?.name ?? "Unknown Patient",
      age: patient?.age ?? 0,
      gender: patient?.gender ?? "other",
      phone: patient?.phone ?? "",
      bloodGroup: patient?.bloodGroup,
      dateOfBirth: "1981-04-12",
      email: "rahul.k@example.com",
      address: "MG Road, Kochi, Ernakulam",
      emergencyContact: { name: "Santhosh K", relation: "Brother", phone: "+91 98470 54321" },
      languagePreference: "Malayalam",
      allergies: allergies.filter((a) => a.patientId === patientId),
      conditions: conditions.filter((c) => c.patientId === patientId),
      medications: medications.filter((m) => m.patientId === patientId),
    };
  },

  async getDoctorPatientView(patientId: string): Promise<DoctorPatientView | null> {
    await delay();
    if (!getPatient(patientId)) return null;
    return {
      patient: getPatient(patientId)!,
      summary: buildSummary(patientId),
      encounters: encountersFor(patientId),
      facets: buildFacets(patientId),
    };
  },
};