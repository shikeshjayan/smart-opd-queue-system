/**
 * Seed the smart-health MongoDB database with realistic data.
 * Usage: npm run db:seed
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import mongoose from "mongoose";
import { scryptSync, randomBytes } from "node:crypto";

config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("MONGODB_URI is not set. Add it to .env.local");
  process.exit(1);
}

function hashPassword(password: string): { passwordHash: string; salt: string } {
  const salt = randomBytes(16).toString("hex");
  const passwordHash = scryptSync(password, salt, 64).toString("hex");
  return { passwordHash, salt };
}

/* ---------------- helpers ---------------- */

const now = new Date();
const iso = (d: Date) => d.toISOString();
const dateStr = (d: Date) => iso(d).slice(0, 10);
const daysAgo = (n: number) => new Date(now.getTime() - n * 86400000);
const hoursAgo = (n: number) => new Date(now.getTime() - n * 3600000);
const timeOn = (d: Date, hh: number, mm: number) => {
  const x = new Date(d);
  x.setHours(hh, mm, 0, 0);
  return iso(x);
};

let patientSeq = 10280;
let tokenSeqers: Record<string, number> = {};
function tokenNum(prefix: string, n: number) {
  return `${prefix}-${String(n).padStart(3, "0")}`;
}

/* ---------------- static reference data ---------------- */

const HOSPITALS = [
  { id: "hos_001", name: "General Hospital Ernakulam", district: "ernakulam", address: "Hospital Road, Kaloor, Ernakulam", phone: "+91 484 238 1000" },
  { id: "hos_002", name: "General Hospital Aluva", district: "ernakulam", address: "Bank Junction, Aluva, Ernakulam", phone: "+91 484 262 4000" },
  { id: "hos_003", name: "Taluk Hospital Perumbavoor", district: "ernakulam", address: "MC Road, Perumbavoor, Ernakulam", phone: "+91 484 252 3000" },
  { id: "hos_004", name: "District Hospital Kottayam", district: "kottayam", address: "KK Road, Kottayam", phone: "+91 481 256 2000" },
  { id: "hos_005", name: "General Hospital Thrissur", district: "thrissur", address: "Round East, Thrissur", phone: "+91 487 233 5000" },
  { id: "hos_006", name: "District Hospital Kozhikode", district: "kozhikode", address: "Beach Road, Kozhikode", phone: "+91 495 236 6000" },
];

const DEPARTMENTS_BY_HOSPITAL: Record<string, string[]> = {
  hos_001: ["General Medicine", "Cardiology", "Orthopaedics", "Paediatrics", "Dermatology"],
  hos_002: ["General Medicine", "Paediatrics", "Obstetrics & Gynaecology"],
  hos_003: ["General Medicine", "Orthopaedics"],
  hos_004: ["General Medicine", "Cardiology", "Paediatrics", "ENT"],
  hos_005: ["General Medicine", "Orthopaedics", "Dermatology"],
  hos_006: ["General Medicine", "Cardiology", "Paediatrics"],
};

let depSeq = 0;
const departments = Object.entries(DEPARTMENTS_BY_HOSPITAL).flatMap(([hospitalId, names]) =>
  names.map((name) => ({ id: `dep_${String(++depSeq).padStart(3, "0")}`, hospitalId, name }))
);

let opdSeq = 0;
const opds = departments.flatMap((dep) => {
  const sessions =
    dep.name === "Cardiology"
      ? [{ name: "Morning OPD", startTime: "08:30", endTime: "12:30" }, { name: "Evening OPD", startTime: "14:00", endTime: "17:00" }]
      : [{ name: "Morning OPD", startTime: "09:00", endTime: "13:00" }];
  return sessions.map((s) => ({
    id: `opd_${String(++opdSeq).padStart(3, "0")}`,
    departmentId: dep.id,
    name: s.name,
    startTime: s.startTime,
    endTime: s.endTime,
    status: "open",
    currentlyServing: null,
    estimatedWaitMinutes: null,
  }));
});

const SPECIALITIES: Record<string, string> = {
  "General Medicine": "Internal Medicine",
  Cardiology: "Cardiology",
  Orthopaedics: "Orthopaedic Surgery",
  Paediatrics: "Paediatrics",
  Dermatology: "Dermatology",
  "Obstetrics & Gynaecology": "Obstetrics & Gynaecology",
  ENT: "ENT Surgery",
};

const DOCTOR_NAMES = [
  "Dr. Anil Kumar V", "Dr. Geetha Menon", "Dr. Ramesh Iyer", "Dr. Lakshmi Priya",
  "Dr. Suresh Babu P", "Dr. Divya Krishnan", "Dr. Joseph Mathew", "Dr. Meenakshi Warrier",
  "Dr. Arun George", "Dr. Sheela Menon", "Dr. Biju Thomas", "Dr. Fathima Beevi",
  "Dr. Vinod Nambiar", "Dr. Preetha Nair", "Dr. Abdul Rasheed", "Dr. Sindhu Varma",
  "Dr. Manoj Pillai", "Dr. Anitha Raghavan",
];
let docSeq = 0;
const doctors = departments.map((dep) => {
  docSeq += 1;
  return {
    id: `doc_${String(docSeq).padStart(3, "0")}`,
    hospitalId: dep.hospitalId,
    departmentId: dep.id,
    name: DOCTOR_NAMES[(docSeq - 1) % DOCTOR_NAMES.length],
    speciality: SPECIALITIES[dep.name] ?? dep.name,
    phone: `+91 9847${String(100000 + docSeq * 137).slice(0, 6)}`,
    email: `${dep.name.toLowerCase().replace(/[^a-z]/g, ".")}.doc${docSeq}@keralahealth.gov.in`,
    status: "active",
    joinedAt: dateStr(daysAgo(400 + docSeq * 90)),
    opdIds: opds.filter((o) => o.departmentId === dep.id).map((o) => o.id),
  };
});

const STAFF = [
  { name: "Radhika Amma", role: "receptionist", hosp: "hos_001" },
  { name: "Sindhu Thomas", role: "clinical_staff", hosp: "hos_001" },
  { name: "Rajesh Pillai", role: "pharmacy", hosp: "hos_001" },
  { name: "Sneha Nair", role: "lab_staff", hosp: "hos_001" },
  { name: "Vinu Chandran", role: "accounts", hosp: "hos_001" },
  { name: "Ancy Mathew", role: "receptionist", hosp: "hos_002" },
  { name: "Jithin Jose", role: "clinical_staff", hosp: "hos_002" },
  { name: "Neethu Venugopal", role: "lab_staff", hosp: "hos_002" },
  { name: "Manu George", role: "accounts", hosp: "hos_004" },
  { name: "Deepa Chandran", role: "clinical_staff", hosp: "hos_005" },
  { name: "Lakshmi Sasi", role: "receptionist", hosp: "hos_005" },
];
let stfSeq = 0;
const staffMembers = STAFF.map((s) => {
  stfSeq += 1;
  return {
    id: `stf_${String(stfSeq).padStart(3, "0")}`,
    hospitalId: s.hosp,
    name: s.name,
    role: s.role,
    phone: `+91 9995${String(100000 + stfSeq * 211).slice(0, 6)}`,
    email: `${s.name.toLowerCase().replace(/\s+/g, ".")}@keralahealth.gov.in`,
    status: "active",
    joinedAt: dateStr(daysAgo(300 + stfSeq * 120)),
  };
});

/* ---------------- patients (realistic Kerala demographics) ---------------- */

const PATIENT_NAMES: [string, "male" | "female"][] = [
  ["Rahul Krishnan", "male"], ["Meera Suresh", "female"], ["Arun Thampi", "male"],
  ["Fathima Rasheed", "female"], ["John Perera", "male"], ["Lakshmi Narayanan", "female"],
  ["Suresh Vasudevan", "male"], ["Anitha Ravindran", "female"], ["Anu Mohandas", "female"],
  ["Suresh Palanisamy", "male"], ["Gopika Anand", "female"], ["Vishnu Prasad", "male"],
  ["Nithya Balan", "female"], ["Karthik Subramanian", "male"], ["Reshma Basheer", "female"],
  ["Sanjay Menon", "male"], ["Deepa Nandakumar", "female"], ["Ajay Ghosh", "male"],
  ["Priya Vijayan", "female"], ["Nandu Sasidharan", "male"], ["Gayathri Devi", "female"],
  ["Rohit Sharma K", "male"], ["Swathi Reddy", "female"], ["Imran Khan A", "male"],
  ["Maya Krishnamoorthy", "female"], ["Tinu Abraham", "male"], ["Jincy Varghese", "female"],
  ["Praveen Raj", "male"], ["Shilpa Shaji", "female"], ["Yadhukrishnan P", "male"],
];

const BLOOD_GROUPS = ["A+", "B+", "O+", "AB+", "A-", "B-", "O-"];
const CONDITIONS = [
  { condition: "Hypertension", meds: ["Telmisartan 40mg", "Amlodipine 5mg"] },
  { condition: "Type 2 Diabetes", meds: ["Metformin 500mg", "Glimepiride 1mg"] },
  { condition: "Asthma", meds: ["Salbutamol inhaler"] },
  { condition: "Hypothyroidism", meds: ["Levothyroxine 50mcg"] },
];
const ALLERGENS = ["Penicillin", "Sulfa drugs", "Dust", "Peanuts", "Aspirin"];

const patients = PATIENT_NAMES.map(([name, gender], i) => {
  patientSeq += i === 0 ? 14 : Math.floor(Math.random() * 4) + 1;
  const ageBase = [45, 34, 58, 29, 62, 41, 50, 36, 27, 55][i % 10];
  const known = i < 9 ? CONDITIONS[i % CONDITIONS.length] : undefined;
  return {
    id: `P${patientSeq}`,
    patientNumber: `KL-ERN-${patientSeq}`,
    name,
    age: ageBase + Math.floor(Math.random() * 5),
    gender,
    phone: `+91 98470 ${String(12345 + i * 1111).slice(0, 5)}`,
    bloodGroup: BLOOD_GROUPS[i % BLOOD_GROUPS.length],
    registeredHospitalId: i < 20 ? "hos_001" : i < 25 ? "hos_002" : "hos_004",
    knownInfo: {
      allergies: i % 4 === 0 ? [ALLERGENS[i % ALLERGENS.length]] : [],
      medications: known?.meds ?? [],
      conditions: known ? [known.condition] : [],
    },
  };
});
const DEMO_PATIENT_ID = patients[0].id;

/* ---------------- users (login identities) ---------------- */

const staffUsers = [
  { id: "doc_001", role: "doctor", name: doctors[1].name, password: "doctor123", scope: { stateId: "kerala", districtId: "ernakulam", hospitalId: "hos_001", departmentId: "dep_002" } },
  { id: "stf_001", role: "receptionist", name: "Radhika Amma", password: "recept123", scope: { stateId: "kerala", districtId: "ernakulam", hospitalId: "hos_001" } },
  { id: "stf_002", role: "clinical_staff", name: "Sindhu Thomas", password: "nurse123", scope: { stateId: "kerala", districtId: "ernakulam", hospitalId: "hos_001" } },
  { id: "stf_004", role: "lab_staff", name: "Sneha Nair", password: "lab123", scope: { stateId: "kerala", districtId: "ernakulam", hospitalId: "hos_001" } },
  { id: "adm_001", role: "hospital_admin", name: "Dr. Sreeja Nambiar", password: "admin123", scope: { stateId: "kerala", districtId: "ernakulam", hospitalId: "hos_001" } },
  { id: "adm_002", role: "hospital_admin", name: "Dr. Prakash Nair", password: "admin123", scope: { stateId: "kerala", districtId: "ernakulam", hospitalId: "hos_002" } },
  { id: "dadm_001", role: "district_admin", name: "K. P. Vishwanath", password: "district123", scope: { stateId: "kerala", districtId: "ernakulam" } },
  { id: "sadm_001", role: "state_admin", name: "Dr. A. Radhakrishnan", password: "state123", scope: { stateId: "kerala" } },
];

const users = [
  ...staffUsers.map((u) => {
    const { passwordHash, salt } = hashPassword(u.password);
    return {
      _id: u.id,
      role: u.role,
      name: u.name,
      passwordHash,
      salt,
      scope: u.scope,
      status: "active",
      createdAt: daysAgo(365),
    };
  }),
  ...patients.slice(0, 12).map((p) => ({
    _id: p.id,
    role: "patient",
    name: p.name,
    phone: p.phone,
    scope: {},
    status: "active",
    createdAt: daysAgo(200),
  })),
];

/* ---------------- today's queue for opd_001 (Cardiology Morning, GH Ernakulam) ---------------- */

const cardiologyMorningOpdId = opds.find(
  (o) => o.departmentId === departments.find((d) => d.hospitalId === "hos_001" && d.name === "Cardiology")?.id &&
    o.name === "Morning OPD"
 )!.id;

const queueEntries: Record<string, unknown>[] = [];
{
  let n = 0;
  const mk = (status: string, patientIdx?: number, priority = "normal", extra: Record<string, unknown> = {}) => {
    n += 1;
    const p = patientIdx !== undefined ? patients[patientIdx] : null;
    queueEntries.push({
      opdId: cardiologyMorningOpdId,
      tokenNumber: tokenNum("A", n),
      tokenId: `tok_A${n}_${dateStr(now)}`,
      status,
      priority,
      overrideAhead: false,
      isCurrentUser: false,
      patientId: p?.id ?? null,
      patientName: p?.name ?? null,
      updatedAt: timeOn(now, 8, 30 + n),
      ...extra,
    });
  };

  for (let i = 0; i < 26; i++) mk("completed", i % patients.length);
  mk("skipped");
  mk("completed", 26);
  mk("skipped");
  mk("in_consultation", 8); // Anu Mohandas currently in consultation
  // waiting list — demo patient Rahul last-but-one
  const waitingIdxs = [1, 2, 3, 4, 5, 6, 11, 13, 15, 17, 19, 21, 23, 24, 28, 0];
  waitingIdxs.forEach((idx, k) =>
    mk("waiting", idx, k === 2 ? "priority" : k === 5 ? "emergency" : k === 12 ? "priority" : "normal")
  );
}

/* ---------------- historical encounters + consultations + prescriptions ---------------- */

const encounters: Record<string, unknown>[] = [];
const consultations: Record<string, unknown>[] = [];
const prescriptions: Record<string, unknown>[] = [];

const CARDIO_STORY = [
  { daysBack: 240, complaint: "Chest heaviness on exertion, occasional palpitations", assessment: "Stage 1 hypertension, borderline dyslipidaemia", plan: "Started Telmisartan 40mg OD, lifestyle modification, lipid profile in 6 weeks", meds: [["Telmisartan", "40mg", "1-0-0", "90"]] },
  { daysBack: 150, complaint: "Follow-up review. BP controlled at home readings", assessment: "Hypertension — well controlled on current therapy", plan: "Continue Telmisartan 40mg OD, review after 3 months", meds: [["Telmisartan", "40mg", "1-0-0", "90"]] },
  { daysBack: 45, complaint: "Routine follow-up, no complaints", assessment: "Hypertension — stable. Advise weight reduction", plan: "Add Amlodipine 2.5mg OD, ECG normal, review 6 weeks", meds: [["Telmisartan", "40mg", "1-0-0", "45"], ["Amlodipine", "2.5mg", "0-0-1", "45"]] },
];

CARDIO_STORY.forEach((visit, vi) => {
  const day = daysAgo(visit.daysBack);
  const encId = `E${dateStr(day).replaceAll("-", "")}00${vi + 1}`;
  encounters.push({
    _id: encId,
    patientId: DEMO_PATIENT_ID,
    doctorId: "doc_001",
    hospitalId: "hos_001",
    departmentId: "dep_002",
    opdId: cardiologyMorningOpdId,
    tokenNumber: tokenNum("A", 10 + vi * 20),
    date: dateStr(day),
    hospitalName: "General Hospital Ernakulam",
    departmentName: "Cardiology",
    doctorName: doctors[1].name,
    status: "completed",
    startedAt: timeOn(day, 9, 15 + vi * 10),
    completedAt: timeOn(day, 9, 35 + vi * 10),
    createdAt: timeOn(day, 9, 5),
    updatedAt: timeOn(day, 9, 35 + vi * 10),
  });
  consultations.push({
    encounterId: encId,
    doctorId: "doc_001",
    patientId: DEMO_PATIENT_ID,
    chiefComplaint: visit.complaint,
    symptoms: visit.daysBack > 200 ? ["chest tightness", "palpitations"] : [],
    observations: "BP recorded, chest clear, no murmurs. Peripheral pulses intact.",
    assessment: visit.assessment,
    plan: visit.plan,
    followUp: { required: true, afterDays: vi === 2 ? 42 : 90, reason: "BP review" },
    vitals: { bp: `${138 - vi * 6}/${88 - vi * 3}`, pulse: 76 + vi, temperature: "37.0", spo2: 98 },
    finalizedAt: timeOn(day, 9, 35 + vi * 10),
    updatedAt: timeOn(day, 9, 35 + vi * 10),
  });
  prescriptions.push({
    patientId: DEMO_PATIENT_ID,
    encounterId: encId,
    doctorId: "doc_001",
    doctorName: doctors[1].name,
    hospitalId: "hos_001",
    items: visit.meds.map(([name, strength, freq, days]) => ({
      medicineName: name,
      strength,
      dosage: "1 tablet",
      frequency: freq,
      route: "oral",
      duration: { value: Number(days), unit: "days" },
      instructions: "After food",
    })),
    instructions: "Maintain low-salt diet. Home BP log twice weekly.",
    workflowStatus: "finalized",
    status: "dispensed",
    createdAt: timeOn(day, 9, 30),
    finalizedAt: timeOn(day, 9, 36),
    updatedAt: timeOn(day, 9, 36),
  });
});

// a few other-patient completed encounters for doctor workspace realism
[2, 5, 9].forEach((pi, k) => {
  const day = daysAgo(k + 2);
  const encId = `E${dateStr(day).replaceAll("-", "")}10${k}`;
  const dep = departments.find((d) => d.hospitalId === "hos_001" && d.name === "General Medicine")!;
  encounters.push({
    _id: encId,
    patientId: patients[pi].id,
    doctorId: "doc_001",
    hospitalId: "hos_001",
    departmentId: dep.id,
    opdId: opds.find((o) => o.departmentId === dep.id && o.name === "Morning OPD")!.id,
    tokenNumber: tokenNum("G", 21 + k * 9),
    date: dateStr(day),
    hospitalName: "General Hospital Ernakulam",
    departmentName: "General Medicine",
    doctorName: DOCTOR_NAMES[0],
    status: "completed",
    startedAt: timeOn(day, 10, 10 + k * 5),
    completedAt: timeOn(day, 10, 30 + k * 5),
    createdAt: timeOn(day, 10, 5),
    updatedAt: timeOn(day, 10, 30 + k * 5),
  });
});

/* ---------------- appointments ---------------- */

const appointments = [3, 7, 12, 18, 22].map((pi, k) => {
  const futureDays = k === 0 ? 0 : k; // first one today
  const day = daysAgo(-futureDays);
  return {
    _id: `APT-${1000 + k}`,
    patientId: patients[pi].id,
    patientName: patients[pi].name,
    hospitalId: "hos_001",
    departmentId: "dep_002",
    doctorId: "doc_001",
    type: k % 2 === 0 ? "follow_up" : "new_visit",
    date: dateStr(day),
    time: `${String(9 + k).padStart(2, "0")}:${k % 2 === 0 ? "00" : "30"}`,
    status: futureDays === 0 ? "confirmed" : "scheduled",
    reason: "Cardiology review",
    createdAt: iso(daysAgo(3)),
    updatedAt: iso(daysAgo(3)),
  };
});

/* ---------------- notifications / settings / alerts ---------------- */

/* ---------------- notifications / settings / alerts ---------------- */

const hospitalNotifications = [
  { hospitalId: "hos_001", audience: "hospital", type: "queue", title: "Queue pressure: General Medicine", message: "General Medicine has 38 patients waiting. Consider opening an additional OPD window.", priority: "high", read: false, createdAt: timeOn(now, 9, 5) },
  { hospitalId: "hos_001", audience: "hospital", type: "alert", title: "Cardiology tokens nearly full", message: "The Cardiology Evening OPD is nearing capacity for today.", priority: "critical", read: false, createdAt: timeOn(now, 8, 40) },
  { hospitalId: "hos_001", audience: "hospital", type: "info", title: "OPD schedule updated", message: "Dermatology Afternoon OPD is unavailable today. Patients are being notified.", priority: "normal", read: false, createdAt: timeOn(now, 8, 30) },
  { hospitalId: "hos_001", audience: "hospital", type: "system", title: "Scheduled maintenance", message: "System maintenance on Sunday from 02:00 to 04:00.", priority: "low", read: true, createdAt: iso(daysAgo(1)) },
];

const settings = [
  { hospitalId: "hos_001", queueHealthThresholds: { warning: 12, critical: 25 }, opdOpenTime: "08:30", opdCloseTime: "17:00", tokenWindowMinutes: 30, updatedAt: iso(daysAgo(2)), updatedBy: "Dr. Sreeja Nambiar" },
  { hospitalId: "hos_002", queueHealthThresholds: { warning: 10, critical: 20 }, opdOpenTime: "09:00", opdCloseTime: "16:00", tokenWindowMinutes: 30, updatedAt: iso(daysAgo(5)), updatedBy: "Dr. Prakash Nair" },
];

const alerts = [
  { districtId: "ernakulam", hospitalId: "hos_002", hospitalName: "General Hospital Aluva", departmentName: "General Medicine", severity: "warning", type: "long_wait", message: "Average waiting time crossed 45 minutes in Morning OPD.", createdAt: timeOn(now, 9, 10), status: "active" },
  { districtId: "ernakulam", hospitalId: "hos_001", hospitalName: "General Hospital Ernakulam", departmentName: "Cardiology", severity: "info", type: "opd_full", message: "Evening OPD nearing capacity for today.", createdAt: timeOn(now, 8, 45), status: "active" },
  { districtId: "kottayam", hospitalId: "hos_004", hospitalName: "District Hospital Kottayam", departmentName: "Paediatrics", severity: "warning", type: "queue_above_threshold", message: "22 patients waiting in Morning OPD.", createdAt: timeOn(now, 9, 2), status: "active" },
  { districtId: "thrissur", hospitalId: "hos_005", hospitalName: "General Hospital Thrissur", departmentName: "Orthopaedics", severity: "resolved", type: "doctor_unavailable", message: "Doctor unavailable earlier today; additional window opened.", createdAt: iso(daysAgo(1)), status: "resolved" },
];

/* ---------------- run ---------------- */

async function main() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI!, { bufferCommands: false });
  console.log("Connected.");

  const db = mongoose.connection.db;
  if (!db) throw new Error("MongoDB connection failed");

  const collections = await db.collections();
  for (const c of collections) {
    await c.deleteMany({});
  }
  console.log(`Cleared ${collections.length} collections.`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const coll = (name: string): any => db.collection(name);

  await coll("hospitals").insertMany(HOSPITALS.map(({ id, ...h }) => ({ _id: id, ...h, opdCount: DEPARTMENTS_BY_HOSPITAL[id]?.length ?? 0, status: "active" })));
  await coll("departments").insertMany(departments.map(({ id, ...d }) => ({ _id: id, ...d, waitingCount: Math.floor(Math.random() * 30) + 4, status: "active" })));
  await coll("opds").insertMany(opds.map(({ id, ...o }) => ({ _id: id, ...o })));
  await coll("doctors").insertMany(doctors.map(({ id, ...d }) => ({ _id: id, ...d })));
  await coll("staffmembers").insertMany(staffMembers.map(({ id, ...s }) => ({ _id: id, ...s })));
  await coll("users").insertMany(users);
  await coll("patients").insertMany(patients.map(({ id, ...p }) => ({ _id: id, ...p })));
  await coll("queueentries").insertMany(queueEntries);
  if (encounters.length) await coll("encounters").insertMany(encounters);
  if (consultations.length) await coll("consultations").insertMany(consultations);
  if (prescriptions.length) await coll("prescriptions").insertMany(prescriptions);
  if (appointments.length) await coll("appointments").insertMany(appointments);
  await coll("notifications").insertMany(hospitalNotifications.map((n, i) => ({ _id: `ntf_${String(i + 1).padStart(3, "0")}`, ...n })));
  await coll("adminsettings").insertMany(settings);
  await coll("governmentalerts").insertMany(alerts.map((a, i) => ({ _id: `gal_${String(i + 1).padStart(3, "0")}`, ...a })));

  // mark the demo patient's active token
  const demoToken = queueEntries.find((q) => q.patientId === DEMO_PATIENT_ID && q.status === "waiting");
  if (demoToken) {
    (demoToken as { tokenId: string }).tokenId = `tok_demo_${DEMO_PATIENT_ID}`;
    await coll("tokens").insertOne({
      _id: `tok_demo_${DEMO_PATIENT_ID}`,
      tokenNumber: (demoToken as { tokenNumber: string }).tokenNumber,
      patientId: DEMO_PATIENT_ID,
      opdId: cardiologyMorningOpdId,
      status: "waiting",
      patientsAhead: 15,
      estimatedWaitMinutes: 60,
      createdAt: timeOn(now, 8, 20),
    });
  }

  // Seed Schedule Configs
  const scheduleConfigs = [
    {
      _id: "sch_001",
      hospitalId: "hos_001",
      departmentId: "dep_001",
      doctorId: "doc_001",
      workdays: [1, 2, 3, 4, 5, 6],
      openTime: "09:00",
      closeTime: "13:00",
      slotDurationMinutes: 15,
      maxBookingsPerSlot: 5,
      holidays: [],
      supportedTypes: ["appointment", "follow_up", "referral"],
      updatedAt: new Date().toISOString(),
    },
    {
      _id: "sch_002",
      hospitalId: "hos_001",
      departmentId: "dep_002",
      doctorId: "doc_002",
      workdays: [1, 2, 3, 4, 5, 6],
      openTime: "09:00",
      closeTime: "13:00",
      slotDurationMinutes: 15,
      maxBookingsPerSlot: 5,
      holidays: [],
      supportedTypes: ["appointment", "follow_up", "referral"],
      updatedAt: new Date().toISOString(),
    },
    {
      _id: "sch_003",
      hospitalId: "hos_001",
      departmentId: "dep_003",
      doctorId: "doc_003",
      workdays: [1, 2, 3, 4, 5, 6],
      openTime: "09:00",
      closeTime: "13:00",
      slotDurationMinutes: 15,
      maxBookingsPerSlot: 5,
      holidays: [],
      supportedTypes: ["appointment", "follow_up", "referral"],
      updatedAt: new Date().toISOString(),
    },
    {
      _id: "sch_004",
      hospitalId: "hos_001",
      departmentId: "dep_004",
      doctorId: "doc_004",
      workdays: [1, 2, 3, 4, 5, 6],
      openTime: "09:00",
      closeTime: "12:00",
      slotDurationMinutes: 15,
      maxBookingsPerSlot: 5,
      holidays: [],
      supportedTypes: ["appointment", "follow_up", "referral"],
      updatedAt: new Date().toISOString(),
    },
    {
      _id: "sch_005",
      hospitalId: "hos_001",
      departmentId: "dep_005",
      doctorId: "doc_005",
      workdays: [1, 2, 3, 4, 5, 6],
      openTime: "09:00",
      closeTime: "13:00",
      slotDurationMinutes: 15,
      maxBookingsPerSlot: 5,
      holidays: [],
      supportedTypes: ["appointment", "follow_up", "referral"],
      updatedAt: new Date().toISOString(),
    },
  ];

  if (scheduleConfigs.length) await coll("scheduleconfigs").insertMany(scheduleConfigs);

  // Seed Slots for today and tomorrow
  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
  const slots: Record<string, unknown>[] = [];
  
  for (const deptId of ["dep_001", "dep_002", "dep_003"]) {
    for (let hour = 9; hour < 13; hour++) {
      for (let min = 0; min < 60; min += 15) {
        const time = `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
        const endTime = min === 45 ? `${String(hour + 1).padStart(2, "0")}:00` : `${String(hour).padStart(2, "0")}:${String(min + 15).padStart(2, "0")}`;
        
        slots.push({
          _id: `slot_${deptId}_${today}_${time}`,
          opdId: deptId,
          hospitalId: "hos_001",
          departmentId: deptId,
          doctorId: deptId.replace("dep_", "doc_"),
          date: today,
          startTime: time,
          endTime: endTime,
          capacity: 5,
          bookedCount: Math.floor(Math.random() * 4),
          status: "available",
        });
        
        slots.push({
          _id: `slot_${deptId}_${tomorrow}_${time}`,
          opdId: deptId,
          hospitalId: "hos_001",
          departmentId: deptId,
          doctorId: deptId.replace("dep_", "doc_"),
          date: tomorrow,
          startTime: time,
          endTime: endTime,
          capacity: 5,
          bookedCount: 0,
          status: "available",
        });
      }
    }
  }
  
  if (slots.length) await coll("slots").insertMany(slots);

  // Seed Queue Audit entries
  const auditEntries: Record<string, unknown>[] = [];
  for (let i = 1; i <= 25; i++) {
    const patientIdx = i % patients.length;
    auditEntries.push({
      opdId: "dep_001",
      tokenNumber: `C-${String(i).padStart(3, "0")}`,
      patientId: patients[patientIdx].id,
      patientName: patients[patientIdx].name,
      fromStatus: "waiting",
      toStatus: "completed",
      actorId: "doc_001",
      timestamp: new Date(Date.now() - (25 - i) * 1800000).toISOString(),
      durationMs: Math.floor(Math.random() * 900000) + 300000,
    });
  }
  
  if (auditEntries.length) await coll("queueaudits").insertMany(auditEntries);

  /* ========== PHASE 24 SEED: Lab/Diagnostics/Pharmacy ========== */

  // --- Pharmacist + Lab Reviewer users ---
  const pharmacistUser = { id: "pha_001", role: "pharmacist", name: "Rajesh Pillai", password: "pharm123", scope: { stateId: "kerala", districtId: "ernakulam", hospitalId: "hos_001" } };
  const reviewerUser = { id: "lab_002", role: "lab_reviewer", name: "Dr. Kavitha Mohan", password: "review123", scope: { stateId: "kerala", districtId: "ernakulam", hospitalId: "hos_001" } };

  for (const u of [pharmacistUser, reviewerUser]) {
    const { passwordHash, salt } = hashPassword(u.password);
    await coll("users").insertOne({
      _id: u.id,
      role: u.role,
      name: u.name,
      passwordHash,
      salt,
      scope: u.scope,
      status: "active",
      createdAt: daysAgo(365),
    });
  }

  // --- Medicine Stock (FEFO demo: older-expiry batch first) ---
  const medicines = [
    { medicineId: "paracetamol", name: "Paracetamol 500mg" },
    { medicineId: "amoxicillin", name: "Amoxicillin 500mg" },
    { medicineId: "metformin", name: "Metformin 500mg" },
    { medicineId: "atorvastatin", name: "Atorvastatin 10mg" },
    { medicineId: "amlodipine", name: "Amlodipine 5mg" },
    { medicineId: "salbutamol", name: "Salbutamol Inhaler" },
    { medicineId: "omeprazole", name: "Omeprazole 20mg" },
    { medicineId: "telmisartan", name: "Telmisartan 40mg" },
  ];

  // Per-hospital minimum levels
  const inventoryConfigs = medicines.map((m) => ({
    hospitalId: "hos_001",
    medicineId: m.medicineId,
    medicineName: m.name,
    minLevel: 100,
    updatedAt: iso(now),
  }));
  await coll("inventoryconfigs").insertMany(inventoryConfigs);

  // Stock batches: some FEFO pairs, one low stock, one expiring soon, one expired
  const stockBatches = [
    // Paracetamol — two batches, FEFO: older expiry first
    { _id: "hos_001:paracetamol:BPA-001", stockId: "STK-001", medicineId: "paracetamol", hospitalId: "hos_001", batchNumber: "BPA-001", quantity: 200, expiryDate: "2026-09-30", unit: "tablets", status: "available", createdAt: daysAgo(120), updatedAt: now },
    { _id: "hos_001:paracetamol:BPA-002", stockId: "STK-002", medicineId: "paracetamol", hospitalId: "hos_001", batchNumber: "BPA-002", quantity: 500, expiryDate: "2027-06-15", unit: "tablets", status: "available", createdAt: daysAgo(30), updatedAt: now },
    // Amoxicillin — normal
    { _id: "hos_001:amoxicillin:BAM-001", stockId: "STK-003", medicineId: "amoxicillin", hospitalId: "hos_001", batchNumber: "BAM-001", quantity: 150, expiryDate: "2027-03-01", unit: "capsules", status: "available", createdAt: daysAgo(90), updatedAt: now },
    // Metformin — LOW STOCK (below min 100)
    { _id: "hos_001:metformin:BMT-001", stockId: "STK-004", medicineId: "metformin", hospitalId: "hos_001", batchNumber: "BMT-001", quantity: 45, expiryDate: "2027-01-20", unit: "tablets", status: "available", createdAt: daysAgo(60), updatedAt: now },
    // Atorvastatin — normal
    { _id: "hos_001:atorvastatin:BAT-001", stockId: "STK-005", medicineId: "atorvastatin", hospitalId: "hos_001", batchNumber: "BAT-001", quantity: 300, expiryDate: "2027-08-10", unit: "tablets", status: "available", createdAt: daysAgo(45), updatedAt: now },
    // Amlodipine — EXPIRING SOON (≤30 days)
    { _id: "hos_001:amlodipine:BAL-001", stockId: "STK-006", medicineId: "amlodipine", hospitalId: "hos_001", batchNumber: "BAL-001", quantity: 80, expiryDate: dateStr(new Date(now.getTime() + 20 * 86400000)), unit: "tablets", status: "available", createdAt: daysAgo(200), updatedAt: now },
    // Salbutamol — EXPIRED
    { _id: "hos_001:salbutamol:BSL-001", stockId: "STK-007", medicineId: "salbutamol", hospitalId: "hos_001", batchNumber: "BSL-001", quantity: 25, expiryDate: dateStr(daysAgo(30)), unit: "inhalers", status: "expired", createdAt: daysAgo(365), updatedAt: now },
    // Omeprazole — normal
    { _id: "hos_001:omeprazole:BOM-001", stockId: "STK-008", medicineId: "omeprazole", hospitalId: "hos_001", batchNumber: "BOM-001", quantity: 250, expiryDate: "2027-05-01", unit: "capsules", status: "available", createdAt: daysAgo(60), updatedAt: now },
    // Telmisartan — normal
    { _id: "hos_001:telmisartan:BTL-001", stockId: "STK-009", medicineId: "telmisartan", hospitalId: "hos_001", batchNumber: "BTL-001", quantity: 180, expiryDate: "2027-04-15", unit: "tablets", status: "available", createdAt: daysAgo(50), updatedAt: now },
  ];
  await coll("medicinestocks").insertMany(stockBatches);

  // --- Lab orders across statuses ---
  const labPatient = patients[0];
  const labDoctor = doctors[1];
  const labOrders = [
    { _id: "LAB-P24-001", orderId: "LAB-60001", patientId: labPatient.id, patientName: labPatient.name, doctorId: labDoctor.id, doctorName: labDoctor.name, hospitalId: "hos_001", hospitalName: HOSPITALS[0].name, departmentName: "Cardiology", items: [{ testId: "t_cbc", testName: "Complete Blood Count", category: "laboratory", priority: "routine", workflow: { status: "sample_collected", sampleId: "SMP-80001", updatedAt: iso(daysAgo(1)) } }, { testId: "t_fbg", testName: "Blood Glucose (Fasting)", category: "laboratory", priority: "routine", workflow: { status: "sample_collected", sampleId: "SMP-80002", updatedAt: iso(daysAgo(1)) } }], specimens: [{ id: "SP-P24-001", orderId: "LAB-60001", patientId: labPatient.id, type: "Blood", status: "collected", sampleId: "SMP-80001", collectedAt: iso(daysAgo(1)), createdAt: iso(daysAgo(1)) }], status: "processing", priority: "routine", clinicalNotes: "Routine pre-op workup", orderedAt: iso(daysAgo(2)), createdAt: iso(daysAgo(3)), updatedAt: iso(daysAgo(1)) },
    { _id: "LAB-P24-002", orderId: "LAB-60002", patientId: patients[2].id, patientName: patients[2].name, doctorId: labDoctor.id, doctorName: labDoctor.name, hospitalId: "hos_001", hospitalName: HOSPITALS[0].name, departmentName: "Cardiology", items: [{ testId: "t_rft", testName: "Renal Function Test", category: "laboratory", priority: "urgent", workflow: { status: "awaiting_verification", updatedAt: iso(hoursAgo(2)) } }, { testId: "t_lft", testName: "Liver Function Test", category: "laboratory", priority: "routine", workflow: { status: "awaiting_verification", updatedAt: iso(hoursAgo(2)) } }], specimens: [{ id: "SP-P24-002", orderId: "LAB-60002", patientId: patients[2].id, type: "Blood", status: "processing", sampleId: "SMP-80003", collectedAt: iso(daysAgo(1)), createdAt: iso(daysAgo(2)) }], status: "awaiting_verification", priority: "urgent", clinicalNotes: "Diabetic patient — check renal and liver", orderedAt: iso(daysAgo(3)), createdAt: iso(daysAgo(4)), updatedAt: iso(hoursAgo(2)) },
    // A result ready for critical alert demo
    { _id: "LAB-P24-003", orderId: "LAB-60003", patientId: patients[4].id, patientName: patients[4].name, doctorId: labDoctor.id, doctorName: labDoctor.name, hospitalId: "hos_001", hospitalName: HOSPITALS[0].name, departmentName: "Cardiology", items: [{ testId: "t_fbg", testName: "Blood Glucose (Fasting)", category: "laboratory", priority: "urgent", workflow: { status: "published", updatedAt: iso(hoursAgo(1)) } }], specimens: [{ id: "SP-P24-003", orderId: "LAB-60003", patientId: patients[4].id, type: "Blood", status: "completed", sampleId: "SMP-80004", collectedAt: iso(daysAgo(2)), createdAt: iso(daysAgo(2)) }], status: "published", priority: "urgent", clinicalNotes: "Hyperglycaemia alert — check fasting glucose", orderedAt: iso(daysAgo(3)), completedAt: iso(hoursAgo(1)), createdAt: iso(daysAgo(4)), updatedAt: iso(hoursAgo(1)) },
  ];
  await coll("diagnosticorders").insertMany(labOrders);

  // --- Results for the lab orders ---
  const labResults = [
    { _id: "RS-P24-001", orderId: "LAB-60002", testId: "t_rft", testName: "Renal Function Test", category: "laboratory", patientId: patients[2].id, status: "submitted_for_verification", values: [{ parameterKey: "cr", name: "Creatinine", unit: "mg/dL", value: "0.9", refLow: 0.6, refHigh: 1.3, flag: "normal" }, { parameterKey: "urea", name: "Urea", unit: "mg/dL", value: "32", refLow: 15, refHigh: 45, flag: "normal" }], submittedAt: iso(hoursAgo(2)), draftedAt: iso(daysAgo(1)), createdAt: iso(daysAgo(1)), updatedAt: iso(hoursAgo(2)) },
    { _id: "RS-P24-002", orderId: "LAB-60002", testId: "t_lft", testName: "Liver Function Test", category: "laboratory", patientId: patients[2].id, status: "submitted_for_verification", values: [{ parameterKey: "alt", name: "ALT", unit: "U/L", value: "42", refLow: 7, refHigh: 56, flag: "normal" }, { parameterKey: "ast", name: "AST", unit: "U/L", value: "38", refLow: 10, refHigh: 40, flag: "normal" }], submittedAt: iso(hoursAgo(2)), draftedAt: iso(daysAgo(1)), createdAt: iso(daysAgo(1)), updatedAt: iso(hoursAgo(2)) },
    // Critical glucose result (unacknowledged → shows on dashboard)
    { _id: "RS-P24-003", orderId: "LAB-60003", testId: "t_fbg", testName: "Blood Glucose (Fasting)", category: "laboratory", patientId: patients[4].id, status: "published", values: [{ parameterKey: "glu", name: "Glucose (Fasting)", unit: "mg/dL", value: "485", refLow: 70, refHigh: 110, criticalLow: 50, criticalHigh: 400, flag: "high" }], critical: { parameters: [{ key: "glu", name: "Glucose (Fasting)", value: "485" }], detectedAt: iso(hoursAgo(1)) }, publishedAt: iso(hoursAgo(1)), verifiedAt: iso(hoursAgo(1)), verifiedById: "lab_002", verifiedByName: "Dr. Kavitha Mohan", draftedAt: iso(daysAgo(2)), createdAt: iso(daysAgo(2)), updatedAt: iso(hoursAgo(1)) },
  ];
  await coll("diagnosticresults").insertMany(labResults);

  // --- Prescriptions in sent_to_pharmacy / partially_dispensed ---
  const prescriptionsForPharmacy = [
    { patientId: labPatient.id, encounterId: "enc_001", doctorId: labDoctor.id, doctorName: labDoctor.name, hospitalId: "hos_001", hospitalName: HOSPITALS[0].name, departmentName: "Cardiology", workflowStatus: "finalized", status: "sent_to_pharmacy", items: [{ id: "rx_m1", medicineId: "paracetamol", medicineName: "Paracetamol 500mg", genericName: "Paracetamol", dosage: "500mg", frequency: "2 × daily", durationDays: 5, duration: { value: 5, unit: "days" }, route: "oral", status: "prescribed", quantity: 10 }], createdAt: iso(daysAgo(1)), finalizedAt: iso(daysAgo(1)), updatedAt: iso(daysAgo(1)) },
    { patientId: patients[2].id, encounterId: "enc_003", doctorId: labDoctor.id, doctorName: labDoctor.name, hospitalId: "hos_001", hospitalName: HOSPITALS[0].name, departmentName: "Cardiology", workflowStatus: "finalized", status: "partially_dispensed", items: [{ id: "rx_m2", medicineId: "metformin", medicineName: "Metformin 500mg", genericName: "Metformin", dosage: "500mg", frequency: "2 × daily", durationDays: 30, duration: { value: 30, unit: "days" }, route: "oral", status: "prescribed", quantity: 60, dispensedQty: 45, dispensedBatches: [{ stockId: "STK-004", batchNumber: "BMT-001", expiryDate: "2027-01-20", qty: 45 }] }], createdAt: iso(daysAgo(3)), finalizedAt: iso(daysAgo(3)), updatedAt: iso(daysAgo(1)) },
  ];
  await coll("prescriptions").insertMany(prescriptionsForPharmacy);

  // --- Diagnostic Slots for CT (next 3 days) ---
  const slotDocs: Record<string, unknown>[] = [];
  for (let day = 0; day < 3; day++) {
    const d = new Date(now.getTime() + day * 86400000);
    const dStr = dateStr(d);
    // CT: 20-min slots, 09:00-13:00 + 14:00-17:00, capacity 1
    for (let m = 540; m < 780; m += 20) {
      const hh = String(Math.floor(m / 60)).padStart(2, "0");
      const mm = String(m % 60).padStart(2, "0");
      const hh2 = String(Math.floor((m + 20) / 60)).padStart(2, "0");
      const mm2 = String((m + 20) % 60).padStart(2, "0");
      slotDocs.push({ _id: `t_ct:hos_001:${dStr}:${hh}:${mm}`, slotId: `DSL-CT-${dStr}-${hh}${mm}`, testId: "t_ct", hospitalId: "hos_001", date: dStr, startTime: `${hh}:${mm}`, endTime: `${hh2}:${mm2}`, durationMinutes: 20, capacity: 1, bookedCount: 0, status: "available" });
    }
    for (let m = 840; m < 1020; m += 20) {
      const hh = String(Math.floor(m / 60)).padStart(2, "0");
      const mm = String(m % 60).padStart(2, "0");
      const hh2 = String(Math.floor((m + 20) / 60)).padStart(2, "0");
      const mm2 = String((m + 20) % 60).padStart(2, "0");
      slotDocs.push({ _id: `t_ct:hos_001:${dStr}:${hh}:${mm}`, slotId: `DSL-CT-${dStr}-${hh}${mm}`, testId: "t_ct", hospitalId: "hos_001", date: dStr, startTime: `${hh}:${mm}`, endTime: `${hh2}:${mm2}`, durationMinutes: 20, capacity: 1, bookedCount: 0, status: "available" });
    }
  }
  if (slotDocs.length) await coll("diagnosticslots").insertMany(slotDocs);

  // --- Stock Transactions (baseline) ---
  const stockTxEntries = stockBatches.map((b) => ({
    txId: `TXN-${b.stockId}`,
    stockId: b.stockId,
    medicineId: b.medicineId,
    hospitalId: b.hospitalId,
    type: "received",
    delta: b.quantity,
    balanceAfter: b.quantity,
    batchNumber: b.batchNumber,
    note: "Initial stock",
    actorId: "adm_001",
    actorName: "Dr. Sreeja Nambiar",
    actorRole: "hospital_admin",
    createdAt: new Date(now.getTime() - 90 * 86400000),
  }));
  await coll("stocktransactions").insertMany(stockTxEntries);

  // --- Pharmacy Audit baseline ---
  await coll("pharmacyaudits").insertMany([
    { action: "stock_received", actorId: "adm_001", actorName: "Dr. Sreeja Nambiar", actorRole: "hospital_admin", detail: { batchCount: stockBatches.length }, createdAt: daysAgo(90) },
  ]);

  // --- Phase 25: Notification seed data ---
  console.log("Seeding Phase 25 notifications...");

  // Notification preferences for patients
  const phase25Prefs = [
    { patientId: patients[0].id, sms: true, email: false, push: true, appointmentReminders: true, queueUpdates: true, resultNotifications: true, prescriptionNotifications: true, followUpReminders: true, announcements: true, locale: "en", phoneVerified: true },
    { patientId: patients[1].id, sms: true, email: false, push: false, appointmentReminders: true, queueUpdates: true, resultNotifications: true, prescriptionNotifications: true, followUpReminders: true, announcements: true, locale: "ml", phoneVerified: false },
    { patientId: patients[2].id, sms: true, email: false, push: true, appointmentReminders: false, queueUpdates: true, resultNotifications: true, prescriptionNotifications: true, followUpReminders: false, announcements: false, locale: "en", phoneVerified: true },
  ];
  await coll("notificationpreferences").insertMany(phase25Prefs);

  // Notifications across all delivery states
  const notifications = [
    {
      _id: "notif_001",
      hospitalId: "hos_001",
      userId: patients[0].id,
      audience: "patient",
      templateKey: "APPOINTMENT_BOOKED",
      category: "appointment",
      title: "Appointment Booked",
      message: "Your OPD appointment at General Hospital Ernakulam (Cardiology) is booked for 2024-01-20 at 10:00. Appointment: APT-1001.",
      bodyEn: "Your OPD appointment at General Hospital Ernakulam (Cardiology) is booked for 2024-01-20 at 10:00. Appointment: APT-1001.",
      bodyMl: "ജനറൽ ഹോസ്പിറ്റൽ എറണാകുളം (കാർഡിയോളജി)-ൽ 2024-01-20 10:00-ന് നിങ്ങളുടെ ഒപിഡി അപ്പോയിൻറ്മെന്റ് ബുക്ക് ചെയ്തിട്ടുണ്ട്. അപ്പോയിൻറ്മെന്റ്: APT-1001.",
      locale: "en",
      priority: "normal",
      required: false,
      read: false,
      deepLink: "/patient/appointments/APT-1001",
      resourceType: "appointment",
      resourceId: "APT-1001",
      channels: ["in_app", "push"],
      idempotencyKey: "n:job_001",
      sentBy: "system",
      createdAt: daysAgo(2).toISOString(),
    },
    {
      _id: "notif_002",
      hospitalId: "hos_001",
      userId: patients[0].id,
      audience: "patient",
      templateKey: "QUEUE_TOKEN_CALLED",
      category: "queue",
      title: "Your Token Is Being Called",
      message: "Token TKN-001 is now being called.\n\nPlease proceed to Room 3, Cardiology OPD.",
      bodyEn: "Token TKN-001 is now being called.\n\nPlease proceed to Room 3, Cardiology OPD.",
      bodyMl: "ടോക്കൺ TKN-001 ഇപ്പോൾ വിളിക്കുന്നു.\n\nദയവായി കാർഡിയോളജി ഒപിഡിയിലെ റൂം 3-ലേക്ക് വരിക.",
      locale: "en",
      priority: "critical",
      required: true,
      read: true,
      readAt: hoursAgo(1).toISOString(),
      deepLink: "/patient/queue",
      resourceType: "token",
      resourceId: "TKN-001",
      channels: ["in_app", "sms", "push"],
      idempotencyKey: "n:job_002",
      sentBy: "system",
      createdAt: hoursAgo(2).toISOString(),
    },
    {
      _id: "notif_003",
      hospitalId: "hos_001",
      userId: patients[1].id,
      audience: "patient",
      templateKey: "LAB_RESULT_AVAILABLE",
      category: "clinical",
      title: "Lab Result Available",
      message: "Your medical test result is available. Please sign in to view it.",
      bodyEn: "Your medical test result is available. Please sign in to view it.",
      bodyMl: "നിങ്ങളുടെ മെഡിക്കൽ ടെസ്റ്റ് ഫലം ലഭ്യമാണ്. കാണുന്നതിന് സൈൻ ഇൻ ചെയ്യുക.",
      locale: "ml",
      priority: "normal",
      required: false,
      read: false,
      deepLink: "/patient/lab-reports/LAB-60002",
      resourceType: "diagnosticResult",
      resourceId: "LAB-60002",
      channels: ["in_app", "push"],
      idempotencyKey: "n:job_003",
      sentBy: "system",
      createdAt: hoursAgo(4).toISOString(),
    },
    {
      _id: "notif_004",
      hospitalId: "hos_001",
      userId: patients[1].id,
      audience: "patient",
      templateKey: "APPOINTMENT_REMINDER",
      category: "appointment",
      title: "Appointment Reminder",
      message: "Your OPD appointment is tomorrow.\n\nGeneral Hospital Ernakulam\nCardiology\n10:00\n\nAppointment: APT-1002",
      bodyEn: "Your OPD appointment is tomorrow.\n\nGeneral Hospital Ernakulam\nCardiology\n10:00\n\nAppointment: APT-1002",
      bodyMl: "നാളെ നിങ്ങളുടെ ഒപിഡി അപ്പോയിൻറ്മെന്റ് ഉണ്ട്.\n\nജനറൽ ഹോസ്പിറ്റൽ എറണാകുളം\nകാർഡിയോളജി\n10:00\n\nഅപ്പോയിൻറ്മെന്റ്: APT-1002",
      locale: "en",
      priority: "normal",
      required: false,
      read: false,
      deepLink: "/patient/appointments/APT-1002",
      resourceType: "appointment",
      resourceId: "APT-1002",
      channels: ["in_app", "sms", "push"],
      idempotencyKey: "n:job_004",
      sentBy: "system",
      createdAt: hoursAgo(6).toISOString(),
    },
    {
      _id: "notif_005",
      hospitalId: "hos_001",
      userId: patients[0].id,
      audience: "patient",
      templateKey: "HOSPITAL_ANNOUNCEMENT",
      category: "announcement",
      title: "Hospital Announcement",
      message: "OPD hours extended to 8 PM starting Monday. Please plan your visits accordingly.",
      bodyEn: "OPD hours extended to 8 PM starting Monday. Please plan your visits accordingly.",
      bodyMl: "തിങ്കളാഴ്ച മുതൽ ഒപിഡി സമയം രാത്രി 8 മണി വരെ നീട്ടിയിട്ടുണ്ട്. നിങ്ങളുടെ സന്ദർശനങ്ങൾ അനുസരിച്ച് ആസൂത്രണം ചെയ്യുക.",
      locale: "en",
      priority: "important",
      required: true,
      read: false,
      deepLink: "/patient/dashboard",
      resourceType: "announcement",
      resourceId: "ann_001",
      channels: ["in_app", "push", "email"],
      idempotencyKey: "n:job_005",
      sentBy: "adm_001",
      createdAt: daysAgo(1).toISOString(),
    },
  ];
  await coll("notifications").insertMany(notifications);

  // Notification deliveries — mix of states
  const deliveries = [
    { _id: "del_001", notificationId: "notif_001", channel: "in_app", state: "delivered", attempts: 1, maxAttempts: 1, providerMessageId: "in_app_abc123", sentAt: daysAgo(2).toISOString(), deliveredAt: daysAgo(2).toISOString(), readAt: null, updatedAt: daysAgo(2).toISOString() },
    { _id: "del_002", notificationId: "notif_001", channel: "push", state: "sent", attempts: 1, maxAttempts: 3, providerMessageId: "push_xyz789", sentAt: daysAgo(2).toISOString(), deliveredAt: null, readAt: null, updatedAt: daysAgo(2).toISOString() },
    { _id: "del_003", notificationId: "notif_002", channel: "in_app", state: "delivered", attempts: 1, maxAttempts: 1, providerMessageId: "in_app_def456", sentAt: hoursAgo(2).toISOString(), deliveredAt: hoursAgo(2).toISOString(), readAt: hoursAgo(1).toISOString(), updatedAt: hoursAgo(1).toISOString() },
    { _id: "del_004", notificationId: "notif_002", channel: "sms", state: "delivered", attempts: 1, maxAttempts: 3, providerMessageId: "sms_mno345", sentAt: hoursAgo(2).toISOString(), deliveredAt: hoursAgo(2).toISOString(), readAt: null, updatedAt: hoursAgo(2).toISOString() },
    { _id: "del_005", notificationId: "notif_002", channel: "push", state: "delivered", attempts: 1, maxAttempts: 3, providerMessageId: "push_qrs678", sentAt: hoursAgo(2).toISOString(), deliveredAt: hoursAgo(2).toISOString(), readAt: null, updatedAt: hoursAgo(2).toISOString() },
    { _id: "del_006", notificationId: "notif_003", channel: "in_app", state: "delivered", attempts: 1, maxAttempts: 1, providerMessageId: "in_app_ghi789", sentAt: hoursAgo(4).toISOString(), deliveredAt: hoursAgo(4).toISOString(), readAt: null, updatedAt: hoursAgo(4).toISOString() },
    { _id: "del_007", notificationId: "notif_003", channel: "push", state: "failed", attempts: 3, maxAttempts: 3, lastError: "Provider rejected recipient (simulated)", providerMessageId: null, sentAt: hoursAgo(4).toISOString(), deliveredAt: null, readAt: null, updatedAt: hoursAgo(3).toISOString() },
    { _id: "del_008", notificationId: "notif_004", channel: "in_app", state: "delivered", attempts: 1, maxAttempts: 1, providerMessageId: "in_app_jkl012", sentAt: hoursAgo(6).toISOString(), deliveredAt: hoursAgo(6).toISOString(), readAt: null, updatedAt: hoursAgo(6).toISOString() },
    { _id: "del_009", notificationId: "notif_004", channel: "sms", state: "sent", attempts: 1, maxAttempts: 3, providerMessageId: "sms_vwx345", sentAt: hoursAgo(6).toISOString(), deliveredAt: null, readAt: null, updatedAt: hoursAgo(6).toISOString() },
    { _id: "del_010", notificationId: "notif_004", channel: "push", state: "delivered", attempts: 1, maxAttempts: 3, providerMessageId: "push_yza678", sentAt: hoursAgo(6).toISOString(), deliveredAt: hoursAgo(6).toISOString(), readAt: null, updatedAt: hoursAgo(6).toISOString() },
    { _id: "del_011", notificationId: "notif_005", channel: "in_app", state: "delivered", attempts: 1, maxAttempts: 1, providerMessageId: "in_app_bcd901", sentAt: daysAgo(1).toISOString(), deliveredAt: daysAgo(1).toISOString(), readAt: null, updatedAt: daysAgo(1).toISOString() },
    { _id: "del_012", notificationId: "notif_005", channel: "push", state: "delivered", attempts: 1, maxAttempts: 3, providerMessageId: "push_efg234", sentAt: daysAgo(1).toISOString(), deliveredAt: daysAgo(1).toISOString(), readAt: null, updatedAt: daysAgo(1).toISOString() },
    { _id: "del_013", notificationId: "notif_005", channel: "email", state: "sent", attempts: 1, maxAttempts: 3, providerMessageId: "email_hij567", sentAt: daysAgo(1).toISOString(), deliveredAt: null, readAt: null, updatedAt: daysAgo(1).toISOString() },
  ];
  await coll("notificationdeliveries").insertMany(deliveries);

  // Notification jobs — queued reminder + one dead-letter
  const jobs = [
    { _id: "job_001", payload: { userId: patients[0].id, templateKey: "APPOINTMENT_REMINDER", params: { hospital: "General Hospital Ernakulam", department: "Cardiology", time: "10:00", appointmentId: "APT-1001" }, hospitalId: "hos_001", audience: "patient", resourceType: "appointment", resourceId: "APT-1001", extraChannels: [], announcementBody: null }, state: "done", attempts: 1, maxAttempts: 3, runAfter: daysAgo(2).toISOString(), lockedAt: null, leaseExpiresAt: null, lastError: null, idempotencyKey: "n:job_001", createdAt: daysAgo(2).toISOString() },
    { _id: "job_002", payload: { userId: patients[0].id, templateKey: "QUEUE_TOKEN_CALLED", params: { token: "TKN-001", department: "Cardiology", room: "3", hospital: "General Hospital Ernakulam" }, hospitalId: "hos_001", audience: "patient", resourceType: "token", resourceId: "TKN-001", extraChannels: [], announcementBody: null }, state: "done", attempts: 1, maxAttempts: 3, runAfter: hoursAgo(2).toISOString(), lockedAt: null, leaseExpiresAt: null, lastError: null, idempotencyKey: "n:job_002", createdAt: hoursAgo(2).toISOString() },
    { _id: "job_003", payload: { userId: patients[1].id, templateKey: "LAB_RESULT_AVAILABLE", params: { orderId: "LAB-60002" }, hospitalId: "hos_001", audience: "patient", resourceType: "diagnosticResult", resourceId: "LAB-60002", extraChannels: [], announcementBody: null }, state: "done", attempts: 1, maxAttempts: 3, runAfter: hoursAgo(4).toISOString(), lockedAt: null, leaseExpiresAt: null, lastError: null, idempotencyKey: "n:job_003", createdAt: hoursAgo(4).toISOString() },
    { _id: "job_004", payload: { userId: patients[1].id, templateKey: "APPOINTMENT_REMINDER", params: { hospital: "General Hospital Ernakulam", department: "Cardiology", time: "10:00", appointmentId: "APT-1002" }, hospitalId: "hos_001", audience: "patient", resourceType: "appointment", resourceId: "APT-1002", extraChannels: [], announcementBody: null }, state: "queued", attempts: 0, maxAttempts: 3, runAfter: new Date(now.getTime() + 3600000).toISOString(), lockedAt: null, leaseExpiresAt: null, lastError: null, idempotencyKey: "n:job_004", createdAt: hoursAgo(6).toISOString() },
    { _id: "job_005", payload: { userId: patients[0].id, templateKey: "HOSPITAL_ANNOUNCEMENT", params: { message: "OPD hours extended to 8 PM starting Monday. Please plan your visits accordingly." }, hospitalId: "hos_001", audience: "patient", announcementBody: "OPD hours extended to 8 PM starting Monday. Please plan your visits accordingly.", sentBy: "adm_001", resourceType: "announcement", resourceId: "ann_001", extraChannels: [] }, state: "done", attempts: 1, maxAttempts: 3, runAfter: daysAgo(1).toISOString(), lockedAt: null, leaseExpiresAt: null, lastError: null, idempotencyKey: "n:job_005", createdAt: daysAgo(1).toISOString() },
    { _id: "job_006", payload: { userId: patients[2].id, templateKey: "APPOINTMENT_CANCELLED", params: { hospital: "General Hospital Ernakulam", date: "2024-01-15", time: "09:00" }, hospitalId: "hos_001", audience: "patient", resourceType: "appointment", resourceId: "APT-1003", extraChannels: [], announcementBody: null }, state: "dead", attempts: 3, maxAttempts: 3, runAfter: daysAgo(3).toISOString(), lockedAt: null, leaseExpiresAt: null, lastError: "SMS provider rejected recipient (simulated)", idempotencyKey: "n:job_006", createdAt: daysAgo(3).toISOString() },
  ];
  await coll("notificationjobs").insertMany(jobs);

  console.log("Phase 25 seed data inserted.");

  console.log("Phase 24 seed data inserted.");
  console.log("  Pharmacist : pha_001 / pharm123");
  console.log("  Lab Reviewer: lab_002 / review123");

  console.log("Seed complete.");
  console.log("Demo logins:");
  console.log("  Patient   : phone", patients[0].phone);
  console.log("  Doctor    : doc_001 / doctor123");
  console.log("  Reception : stf_001 / recept123");
  console.log("  Nurse     : stf_002 / nurse123");
  console.log("  Lab       : stf_004 / lab123");
  console.log("  Hosp Admin: adm_001 / admin123");
  console.log("  Dist Admin: dadm_001 / district123");
  console.log("  State Admin: sadm_001 / state123");

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
