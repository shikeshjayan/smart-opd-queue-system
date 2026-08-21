import {
  getDepartment,
  getHospital,
  getOpd,
  getPatient,
  listDepartments,
  listOpds,
  listQueue,
  mockDoctors,
  mockPatients,
  registerQueueEntry,
  setQueueEntryStatus,
} from "../data";
import { getTokenConfigSync, getTokenPrefixSync } from "@/services/hospital-ops";
import type {
  NewPatientInput,
  OPDRegistration,
  OPDToken,
  Page,
  PatientSearchResult,
  PotentialDuplicate,
  RegistrationFilters,
  RegistrationRecord,
  RegistrationStats,
  TokenCancelReason,
  TokenFilters,
} from "@/features/registration/types/registration.types";

const delay = () => new Promise((resolve) => setTimeout(resolve, 300));

const DEPARTMENT_LETTERS: Record<string, string> = {
  dep_001: "A",
  dep_002: "G",
  dep_003: "O",
  dep_004: "P",
  dep_005: "G",
  dep_006: "D",
  dep_007: "G",
  dep_008: "P",
  dep_009: "A",
  dep_010: "E",
  dep_011: "G",
  dep_012: "P",
  dep_013: "D",
  dep_014: "G",
  dep_015: "P",
  dep_016: "G",
  dep_017: "O",
};

const seededPatients: PatientSearchResult[] = [
  {
    id: "P202608170001",
    name: "Rajesh Kumar",
    age: 38,
    gender: "male",
    phone: "+91 98470 99991",
    bloodGroup: "B+",
  },
  {
    id: "P202608160001",
    name: "Mini Jacob",
    age: 52,
    gender: "female",
    phone: "+91 98470 99992",
    bloodGroup: "A+",
  },
];

for (const patient of seededPatients) {
  if (!mockPatients[patient.id]) {
    mockPatients[patient.id] = {
      id: patient.id,
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      phone: patient.phone,
      bloodGroup: patient.bloodGroup,
      registeredHospitalId: "hos_001",
      knownInfo: { allergies: [], medications: [], conditions: [] },
    };
  }
}

type SeedRecord = Omit<
  RegistrationRecord,
  "status" | "cancelledReason" | "cancelledAt" | "reissuedTokenNumber"
> & {
  status?: RegistrationRecord["status"];
  cancelledReason?: string;
  cancelledAt?: string;
  reissuedTokenNumber?: string;
};

const seedRecords: SeedRecord[] = [
  { id: "reg_001", patientId: "P10421", patientName: "Anu M", isNewPatient: false, hospitalId: "hos_001", departmentId: "dep_001", departmentName: "Cardiology", opdId: "opd_001", opdName: "Morning OPD", tokenNumber: "A-039", registrationType: "walk_in", createdAt: "2026-08-18T09:05:00" },
  { id: "reg_002", patientId: "P10301", patientName: "Meera S", isNewPatient: false, hospitalId: "hos_001", departmentId: "dep_001", departmentName: "Cardiology", opdId: "opd_001", opdName: "Morning OPD", tokenNumber: "A-040", registrationType: "walk_in", createdAt: "2026-08-18T09:20:00" },
  { id: "reg_003", patientId: "P10302", patientName: "Arun T", isNewPatient: false, hospitalId: "hos_001", departmentId: "dep_001", departmentName: "Cardiology", opdId: "opd_001", opdName: "Morning OPD", tokenNumber: "A-041", registrationType: "appointment", appointmentId: "APT-2031", createdAt: "2026-08-18T09:35:00" },
  { id: "reg_004", patientId: "P10303", patientName: "Fathima K", isNewPatient: false, hospitalId: "hos_001", departmentId: "dep_002", departmentName: "General Medicine", opdId: "opd_004", opdName: "Morning OPD", tokenNumber: "G-055", registrationType: "walk_in", createdAt: "2026-08-18T09:50:00" },
  { id: "reg_005", patientId: "P10305", patientName: "Lakshmi N", isNewPatient: false, hospitalId: "hos_001", departmentId: "dep_004", departmentName: "Pediatrics", opdId: "opd_008", opdName: "Morning OPD", tokenNumber: "P-021", registrationType: "walk_in", createdAt: "2026-08-18T10:05:00" },
  { id: "reg_006", patientId: "P10307", patientName: "Anitha R", isNewPatient: false, hospitalId: "hos_001", departmentId: "dep_002", departmentName: "General Medicine", opdId: "opd_004", opdName: "Morning OPD", tokenNumber: "G-056", registrationType: "walk_in", createdAt: "2026-08-18T10:12:00", status: "cancelled", cancelledReason: "patient_requested", cancelledAt: "2026-08-18T10:30:00" },
  { id: "reg_007", patientId: "P10306", patientName: "Suresh V", isNewPatient: false, hospitalId: "hos_001", departmentId: "dep_001", departmentName: "Cardiology", opdId: "opd_001", opdName: "Morning OPD", tokenNumber: "A-012", registrationType: "walk_in", createdAt: "2026-08-17T09:15:00" },
  { id: "reg_008", patientId: "P202608170001", patientName: "Rajesh Kumar", isNewPatient: true, hospitalId: "hos_001", departmentId: "dep_002", departmentName: "General Medicine", opdId: "opd_004", opdName: "Morning OPD", tokenNumber: "G-102", registrationType: "walk_in", createdAt: "2026-08-17T10:00:00" },
  { id: "reg_009", patientId: "P10421", patientName: "Anu M", isNewPatient: false, hospitalId: "hos_001", departmentId: "dep_004", departmentName: "Pediatrics", opdId: "opd_008", opdName: "Morning OPD", tokenNumber: "P-018", registrationType: "appointment", appointmentId: "APT-2027", createdAt: "2026-08-17T11:10:00" },
  { id: "reg_010", patientId: "P10892", patientName: "Suresh P", isNewPatient: false, hospitalId: "hos_001", departmentId: "dep_002", departmentName: "General Medicine", opdId: "opd_004", opdName: "Morning OPD", tokenNumber: "G-048", registrationType: "walk_in", createdAt: "2026-08-16T09:30:00" },
  { id: "reg_011", patientId: "P10294", patientName: "Rahul K", isNewPatient: false, hospitalId: "hos_001", departmentId: "dep_001", departmentName: "Cardiology", opdId: "opd_001", opdName: "Morning OPD", tokenNumber: "A-009", registrationType: "walk_in", createdAt: "2026-08-16T10:40:00" },
  { id: "reg_012", patientId: "P202608160001", patientName: "Mini Jacob", isNewPatient: true, hospitalId: "hos_001", departmentId: "dep_003", departmentName: "Orthopedics", opdId: "opd_006", opdName: "Morning OPD", tokenNumber: "O-015", registrationType: "walk_in", createdAt: "2026-08-16T11:05:00" },
  { id: "reg_013", patientId: "P10304", patientName: "John P", isNewPatient: false, hospitalId: "hos_001", departmentId: "dep_002", departmentName: "General Medicine", opdId: "opd_004", opdName: "Morning OPD", tokenNumber: "G-077", registrationType: "walk_in", createdAt: "2026-08-12T09:45:00" },
  { id: "reg_014", patientId: "P10305", patientName: "Lakshmi N", isNewPatient: false, hospitalId: "hos_001", departmentId: "dep_001", departmentName: "Cardiology", opdId: "opd_001", opdName: "Morning OPD", tokenNumber: "A-021", registrationType: "walk_in", createdAt: "2026-08-05T10:20:00" },
];

const registrationRecords: RegistrationRecord[] = seedRecords.map((record) => ({
  ...record,
  status: record.status ?? "active",
}));

const registeredTokens: OPDToken[] = [
  { id: "tok_reg_001", tokenNumber: "A-039", patientId: "P10421", patientName: "Anu M", hospitalId: "hos_001", departmentId: "dep_001", departmentName: "Cardiology", opdId: "opd_001", opdName: "Morning OPD", status: "in_consultation", registrationType: "walk_in", createdAt: "2026-08-18T09:05:00" },
  { id: "tok_reg_002", tokenNumber: "A-040", patientId: "P10301", patientName: "Meera S", hospitalId: "hos_001", departmentId: "dep_001", departmentName: "Cardiology", opdId: "opd_001", opdName: "Morning OPD", status: "waiting", registrationType: "walk_in", createdAt: "2026-08-18T09:20:00" },
  { id: "tok_reg_003", tokenNumber: "A-041", patientId: "P10302", patientName: "Arun T", hospitalId: "hos_001", departmentId: "dep_001", departmentName: "Cardiology", opdId: "opd_001", opdName: "Morning OPD", status: "waiting", registrationType: "appointment", createdAt: "2026-08-18T09:35:00" },
  { id: "tok_reg_004", tokenNumber: "G-055", patientId: "P10303", patientName: "Fathima K", hospitalId: "hos_001", departmentId: "dep_002", departmentName: "General Medicine", opdId: "opd_004", opdName: "Morning OPD", status: "waiting", registrationType: "walk_in", createdAt: "2026-08-18T09:50:00" },
  { id: "tok_reg_005", tokenNumber: "P-021", patientId: "P10305", patientName: "Lakshmi N", hospitalId: "hos_001", departmentId: "dep_004", departmentName: "Pediatrics", opdId: "opd_008", opdName: "Morning OPD", status: "completed", registrationType: "walk_in", createdAt: "2026-08-18T10:05:00" },
  { id: "tok_reg_006", tokenNumber: "G-056", patientId: "P10307", patientName: "Anitha R", hospitalId: "hos_001", departmentId: "dep_002", departmentName: "General Medicine", opdId: "opd_004", opdName: "Morning OPD", status: "cancelled", registrationType: "walk_in", cancelReason: "patient_requested", createdAt: "2026-08-18T10:12:00" },
];

function normalize(value: string): string {
  return value.replace(/[^a-z0-9]/gi, "").toLowerCase();
}

function last4(phone: string): string {
  return phone.replace(/\D/g, "").slice(-4);
}

function prefixFor(opd: { id: string; departmentId: string; currentlyServing: string | null }): string {
  const configured = getTokenPrefixSync(opd.departmentId);
  if (configured) return configured;
  const fromServing = opd.currentlyServing?.split("-")[0]?.toUpperCase();
  if (fromServing) return fromServing;
  return DEPARTMENT_LETTERS[opd.departmentId] ?? "T";
}

function maxNumberFor(prefix: string, numbers: string[]): number {
  return numbers.reduce((max, tokenNumber) => {
    const [p, raw] = tokenNumber.split("-");
    if (p?.toUpperCase() === prefix) {
      const num = Number.parseInt(raw ?? "", 10);
      if (!Number.isNaN(num)) return Math.max(max, num);
    }
    return max;
  }, 0);
}

function nextPatientId(): string {
  const now = new Date();
  const day = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const todayCount = Object.keys(mockPatients).filter((id) => id.startsWith(`P${day}`)).length;
  return `P${day}${String(todayCount + 1).padStart(4, "0")}`;
}

function doctorForOpd(opdId: string): string {
  const doctor = mockDoctors.find((d) => d.opdIds.includes(opdId));
  return doctor?.name ?? "—";
}

function sortRecords(records: RegistrationRecord[]): RegistrationRecord[] {
  return [...records].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export const registrationService = {
  async getStats(): Promise<RegistrationStats> {
    await delay();
    return { total: 228, newPatients: 42, existingPatients: 186, tokensGenerated: 228, cancelled: 11, waiting: 36 };
  },

  async recentRegistrations(): Promise<RegistrationRecord[]> {
    await delay();
    return sortRecords(registrationRecords).slice(0, 6);
  },

  async searchPatients(query: string): Promise<PatientSearchResult[]> {
    await delay();
    const q = normalize(query.trim());
    if (!q) return [];
    const results: PatientSearchResult[] = [];
    for (const patient of Object.values(mockPatients)) {
      const needle = normalize(patient.phone);
      if (
        normalize(patient.id).includes(q) ||
        normalize(patient.name).includes(q) ||
        needle.includes(q) ||
        (q.length >= 4 && needle.includes(last4(q)))
      ) {
        const lastRecord = sortRecords(registrationRecords.filter((r) => r.patientId === patient.id))[0];
        results.push({
          id: patient.id,
          name: patient.name,
          age: patient.age,
          gender: patient.gender,
          phone: patient.phone,
          bloodGroup: patient.bloodGroup,
          lastVisit: lastRecord?.createdAt.slice(0, 10),
        });
      }
    }
    return results.slice(0, 10);
  },

  async getPatientById(patientId: string): Promise<PatientSearchResult | undefined> {
    await delay();
    const patient = getPatient(patientId);
    if (!patient) return undefined;
    const lastRecord = sortRecords(registrationRecords.filter((r) => r.patientId === patientId))[0];
    return {
      id: patient.id,
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      phone: patient.phone,
      bloodGroup: patient.bloodGroup,
      lastVisit: lastRecord?.createdAt.slice(0, 10),
    };
  },

  async findPotentialDuplicates(name: string, mobile: string): Promise<PotentialDuplicate[]> {
    await delay();
    const nameKey = normalize(name);
    const mobileKey = last4(mobile);
    const matches: PotentialDuplicate[] = [];
    for (const patient of Object.values(mockPatients)) {
      if (!mobileKey && !nameKey) continue;
      const nameMatch = nameKey && (normalize(patient.name).includes(nameKey) || nameKey.includes(normalize(patient.name)));
      const mobileMatch = mobileKey && last4(patient.phone) === mobileKey;
      if (nameMatch || mobileMatch) {
        matches.push({ id: patient.id, name: patient.name, age: patient.age, mobileLast4: last4(patient.phone) });
      }
    }
    return matches.slice(0, 4);
  },

  async createPatient(input: NewPatientInput): Promise<PatientSearchResult> {
    await delay();
    const id = nextPatientId();
    const age = input.dateOfBirth
      ? Math.max(0, new Date().getFullYear() - Number.parseInt(input.dateOfBirth.slice(0, 4), 10))
      : 0;
    const patient = {
      id,
      name: input.name,
      age,
      gender: input.gender,
      phone: input.mobile,
      bloodGroup: undefined,
      registeredHospitalId: "hos_001",
      knownInfo: { allergies: [], medications: [], conditions: [] },
    };
    mockPatients[id] = patient;
    return {
      id,
      name: input.name,
      age,
      gender: input.gender,
      phone: input.mobile,
      bloodGroup: undefined,
    };
  },

  async listOpds(hospitalId: string): Promise<OPDRegistration[]> {
    await delay();
    const hospital = getHospital(hospitalId);
    if (!hospital) return [];
    const result: OPDRegistration[] = [];
    const departments = listDepartments(hospitalId);
    for (const department of departments) {
      const opds = listOpds(department.id);
      for (const opd of opds) {
        const queue = listQueue(opd.id);
        const generated = queue.length;
        const capacity = 50;
        let availability: OPDRegistration["availability"];
        if (opd.status === "full") availability = "full";
        else if (opd.status === "closed" || opd.status === "unavailable" || opd.status === "paused")
          availability = "closed";
        else if (generated >= capacity) availability = "full";
        else if (generated >= Math.round(capacity * 0.8)) availability = "almost_full";
        else availability = "available";
        result.push({
          opdId: opd.id,
          opdName: opd.name,
          startTime: opd.startTime,
          endTime: opd.endTime,
          departmentId: department.id,
          departmentName: department.name,
          doctorName: doctorForOpd(opd.id),
          queueCount: queue.filter((q) => q.status === "waiting").length,
          capacity,
          generated,
          availability,
          estimatedWaitMinutes: opd.estimatedWaitMinutes,
        });
      }
    }
    return result.sort((a, b) => a.departmentName.localeCompare(b.departmentName) || a.startTime.localeCompare(b.startTime));
  },

  async generateToken(input: {
    patientId: string;
    patientName: string;
    opdId: string;
    registrationType: "walk_in" | "appointment";
    appointmentId?: string;
    isNewPatient: boolean;
  }): Promise<{ token: OPDToken; record: RegistrationRecord }> {
    await delay();
    const opd = getOpd(input.opdId);
    if (!opd) throw new Error("OPD not found");
    if (
      opd.status === "full" ||
      opd.status === "closed" ||
      opd.status === "unavailable" ||
      opd.status === "paused"
    ) {
      throw new Error("This OPD is not accepting tokens right now.");
    }
    const department = getDepartment(opd.departmentId);
    const queue = listQueue(opd.id);
    const tokenConfig = getTokenConfigSync("hos_001");
    const prefix = prefixFor(opd);
    const todayPrefix = new Date().toISOString().slice(0, 10);
    const sameDay = (iso?: string) => Boolean(iso && iso.slice(0, 10) === todayPrefix);
    const registrationNumbers = registrationRecords
      .filter((r) => r.opdId === opd.id && (!tokenConfig?.dailyReset || sameDay(r.createdAt)))
      .map((r) => r.tokenNumber);
    const tokenNumbers = registeredTokens
      .filter((t) => t.opdId === opd.id && (!tokenConfig?.dailyReset || sameDay(t.createdAt)))
      .map((t) => t.tokenNumber);
    const maxNumber = Math.max(
      maxNumberFor(prefix, queue.map((q) => q.tokenNumber)),
      maxNumberFor(prefix, registrationNumbers),
      maxNumberFor(prefix, tokenNumbers)
    );
    const nextNumber = maxNumber + 1;
    if (tokenConfig && nextNumber > tokenConfig.maxDailyTokens) {
      throw new Error(
        `Maximum daily tokens (${tokenConfig.maxDailyTokens}) reached for this department. Please try tomorrow.`
      );
    }
    const tokenNumber = `${prefix}-${String(nextNumber).padStart(3, "0")}`;

    const now = new Date().toISOString();
    const token: OPDToken = {
      id: `tok_reg_${Date.now()}`,
      tokenNumber,
      patientId: input.patientId,
      patientName: input.patientName,
      hospitalId: "hos_001",
      departmentId: opd.departmentId,
      departmentName: department?.name ?? "",
      opdId: opd.id,
      opdName: opd.name,
      status: "waiting",
      registrationType: input.registrationType,
      createdAt: now,
    };
    registeredTokens.unshift(token);
    registerQueueEntry(opd.id, {
      tokenNumber,
      patientId: input.patientId,
      patientName: input.patientName,
    });

    const record: RegistrationRecord = {
      id: `reg_${Date.now()}`,
      patientId: input.patientId,
      patientName: input.patientName,
      isNewPatient: input.isNewPatient,
      hospitalId: "hos_001",
      departmentId: opd.departmentId,
      departmentName: department?.name ?? "",
      opdId: opd.id,
      opdName: opd.name,
      tokenNumber,
      registrationType: input.registrationType,
      appointmentId: input.appointmentId,
      createdAt: now,
      status: "active",
    };
    registrationRecords.unshift(record);
    return { token, record };
  },

  async cancelToken(tokenNumber: string, reason: TokenCancelReason): Promise<OPDToken> {
    await delay();
    const token = registeredTokens.find((t) => t.tokenNumber === tokenNumber);
    if (!token) throw new Error("Token not found");
    if (token.status === "cancelled") throw new Error("Token is already cancelled");
    token.status = "cancelled";
    token.cancelReason = reason;
    setQueueEntryStatus(tokenNumber, "cancelled");
    const record = registrationRecords.find((r) => r.tokenNumber === tokenNumber);
    if (record) {
      record.status = "cancelled";
      record.cancelledReason = reason;
      record.cancelledAt = new Date().toISOString();
    }
    return token;
  },

  async reissueToken(tokenNumber: string): Promise<OPDToken> {
    await delay();
    const original = registeredTokens.find((t) => t.tokenNumber === tokenNumber);
    if (!original) throw new Error("Token not found");
    if (original.status !== "cancelled") throw new Error("Only cancelled tokens can be reissued.");
    const result = await registrationService.generateToken({
      patientId: original.patientId,
      patientName: original.patientName,
      opdId: original.opdId,
      registrationType: original.registrationType,
      isNewPatient: false,
    });
    original.reissuedTo = result.token.tokenNumber;
    result.token.reissuedFrom = tokenNumber;
    const record = registrationRecords.find((r) => r.tokenNumber === tokenNumber);
    if (record) record.reissuedTokenNumber = result.token.tokenNumber;
    return result.token;
  },

  async listTokens(filters: TokenFilters): Promise<OPDToken[]> {
    await delay();
    const query = filters.query?.trim().toLowerCase() ?? "";
    return registeredTokens
      .filter((token) => {
        if (filters.departmentId && token.departmentId !== filters.departmentId) return false;
        if (filters.opdId && token.opdId !== filters.opdId) return false;
        if (filters.status && token.status !== filters.status) return false;
        if (
          query &&
          !token.tokenNumber.toLowerCase().includes(query) &&
          !token.patientName.toLowerCase().includes(query)
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async listRegistrations(filters: RegistrationFilters, page: number, pageSize: number): Promise<Page<RegistrationRecord>> {
    await delay();
    const filtered = sortRecords(registrationRecords).filter((record) => {
      if (filters.departmentId && record.departmentId !== filters.departmentId) return false;
      if (filters.opdId && record.opdId !== filters.opdId) return false;
      if (filters.type && record.registrationType !== filters.type) return false;
      if (filters.date && record.createdAt.slice(0, 10) !== filters.date) return false;
      return true;
    });
    const total = filtered.length;
    const start = (page - 1) * pageSize;
    return { items: filtered.slice(start, start + pageSize), total, page, pageSize };
  },

  async getPatientActivity(patientId: string): Promise<{ records: RegistrationRecord[]; tokens: OPDToken[] }> {
    await delay();
    return {
      records: sortRecords(registrationRecords.filter((r) => r.patientId === patientId)),
      tokens: registeredTokens.filter((t) => t.patientId === patientId),
    };
  },
};