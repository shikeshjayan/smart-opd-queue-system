import mongoose, { Schema, type Model } from "mongoose";
import type {
  AdminNotification,
  AdminSettings,
  Department,
  DoctorRecord,
  Encounter,
  GovernmentAlert,
  Hospital,
  OPD,
  PatientSummary,
  StaffMember,
} from "@/types";
import type { UserRole } from "@/features/auth/types/auth.types";

/* ---------- helpers ---------- */

type WithOptionalId = { _id?: unknown };

/** Convert a mongoose document / lean object into a plain frontend shape (_id -> id). */
export function plain<T>(doc: WithOptionalId | null | undefined): T {
  if (!doc) return null as T;
  const obj = JSON.parse(JSON.stringify(doc)) as Record<string, unknown> & { _id?: string; id?: string };
  if ("_id" in obj) {
    obj.id = obj.id ?? obj._id;
    delete obj._id;
  }
  return obj as T;
}

export function plainList<T>(docs: readonly (WithOptionalId | null | undefined)[] | undefined): T[] {
  return (docs ?? []).map((d) => plain<T>(d));
}

/* ---------- Auth users (staff + patient login identities) ---------- */

export type UserDoc = {
  _id: string;
  role: UserRole;
  name: string;
  phone?: string;
  passwordHash?: string;
  salt?: string;
  scope: {
    stateId?: string;
    districtId?: string;
    hospitalId?: string;
    departmentId?: string;
  };
  status: "active" | "inactive";
  createdAt: Date;
};

const userSchema = new Schema<UserDoc>(
  {
    _id: { type: String, required: true },
    role: {
      type: String,
      required: true,
      enum: [
        "patient",
        "doctor",
        "clinical_staff",
        "receptionist",
        "lab_staff",
        "hospital_admin",
        "district_admin",
        "state_admin",
      ],
    },
    name: { type: String, required: true },
    phone: { type: String },
    passwordHash: { type: String },
    salt: { type: String },
    scope: {
      stateId: String,
      districtId: String,
      hospitalId: String,
      departmentId: String,
    },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

userSchema.index({ phone: 1 });

export const UserModel: Model<UserDoc> =
  (mongoose.models.User as Model<UserDoc>) ?? mongoose.model<UserDoc>("User", userSchema);

/* ---------- OTP codes ---------- */

const otpSchema = new Schema(
  {
    phone: { type: String, required: true, index: true },
    code: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
  },
  { versionKey: false }
);
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OtpModel = mongoose.models.Otp ?? mongoose.model("Otp", otpSchema);

/* ---------- Hospitals / Departments / OPDs / Doctors / Staff ---------- */

const hospitalSchema = new Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    district: { type: String, required: true, index: true },
    address: String,
    phone: String,
    opdCount: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { versionKey: false }
);

const departmentSchema = new Schema(
  {
    _id: { type: String, required: true },
    hospitalId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    waitingCount: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { versionKey: false }
);

const opdSchema = new Schema(
  {
    _id: { type: String, required: true },
    departmentId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    startTime: String,
    endTime: String,
    status: {
      type: String,
      enum: ["open", "closed", "full", "paused", "unavailable"],
      default: "open",
    },
    currentlyServing: { type: String, default: null },
    estimatedWaitMinutes: { type: Number, default: null },
    statusReason: String,
    statusUpdatedAt: String,
  },
  { versionKey: false }
);

const doctorSchema = new Schema(
  {
    _id: { type: String, required: true },
    hospitalId: { type: String, required: true, index: true },
    departmentId: { type: String, required: true },
    name: { type: String, required: true },
    speciality: String,
    phone: String,
    email: String,
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    joinedAt: String,
    opdIds: { type: [String], default: [] },
  },
  { versionKey: false }
);

const staffSchema = new Schema(
  {
    _id: { type: String, required: true },
    hospitalId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    role: String,
    phone: String,
    email: String,
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    joinedAt: String,
  },
  { versionKey: false }
);

export const HospitalModel =
  (mongoose.models.Hospital as Model<Hospital>) ??
  mongoose.model("Hospital", hospitalSchema);

export const DepartmentModel =
  (mongoose.models.Department as Model<Department>) ??
  mongoose.model("Department", departmentSchema);

export const OpdModel =
  (mongoose.models.Opd as Model<OPD>) ?? mongoose.model("Opd", opdSchema);

export const DoctorModel =
  (mongoose.models.Doctor as Model<DoctorRecord>) ??
  mongoose.model("Doctor", doctorSchema);

export const StaffModel =
  (mongoose.models.StaffMember as Model<StaffMember>) ??
  mongoose.model("StaffMember", staffSchema);

/* ---------- Patients ---------- */

const patientSchema = new Schema(
  {
    _id: { type: String, required: true },
    patientNumber: String,
    name: { type: String, required: true },
    age: Number,
    gender: { type: String, enum: ["male", "female", "other"] },
    phone: String,
    bloodGroup: String,
    registeredHospitalId: { type: String, index: true },
    knownInfo: {
      allergies: [String],
      medications: [String],
      conditions: [String],
    },
  },
  { versionKey: false }
);

patientSchema.index({ phone: 1 });
patientSchema.index({ name: 1 });

export const PatientModel =
  (mongoose.models.Patient as Model<PatientSummary>) ??
  mongoose.model("Patient", patientSchema);

/* ---------- Queue entries ---------- */

export type QueueEntryDoc = {
  _id: string;
  opdId: string;
  tokenNumber: string;
  tokenId?: string;
  status: string;
  priority: string;
  overrideAhead: boolean;
  isCurrentUser: boolean;
  patientId: string | null;
  patientName: string | null;
  position?: number;
  updatedAt: string;
};

const queueEntrySchema = new Schema<QueueEntryDoc>(
  {
    opdId: { type: String, required: true, index: true },
    tokenNumber: { type: String, required: true },
    tokenId: String,
    status: {
      type: String,
      enum: ["waiting", "called", "in_consultation", "completed", "skipped", "cancelled", "expired", "no_show"],
      default: "waiting",
    },
    priority: {
      type: String,
      enum: ["normal", "priority", "emergency"],
      default: "normal",
    },
    overrideAhead: { type: Boolean, default: false },
    isCurrentUser: { type: Boolean, default: false },
    patientId: { type: String, default: null },
    patientName: { type: String, default: null },
    position: Number,
    updatedAt: { type: String, required: true },
  },
  { versionKey: false }
);

queueEntrySchema.index({ opdId: 1, tokenNumber: 1 }, { unique: true });

export const QueueEntryModel: Model<QueueEntryDoc> =
  (mongoose.models.QueueEntry as Model<QueueEntryDoc>) ??
  mongoose.model<QueueEntryDoc>("QueueEntry", queueEntrySchema);

/* ---------- Encounters ---------- */

const encounterSchema = new Schema(
  {
    _id: { type: String, required: true },
    patientId: { type: String, required: true, index: true },
    doctorId: { type: String, required: true },
    hospitalId: String,
    departmentId: String,
    opdId: String,
    tokenId: String,
    tokenNumber: String,
    date: { type: String, required: true },
    hospitalName: String,
    departmentName: String,
    doctorName: String,
    status: {
      type: String,
      enum: ["open", "in_progress", "completed", "cancelled"],
      default: "open",
    },
    startedAt: String,
    completedAt: String,
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
  },
  { versionKey: false }
);

export const EncounterModel =
  (mongoose.models.Encounter as Model<Encounter>) ??
  mongoose.model("Encounter", encounterSchema);

/* ---------- Consultation records (clinical text keyed by encounterId) ---------- */

const consultationSchema = new Schema(
  {
    encounterId: { type: String, required: true, unique: true },
    doctorId: String,
    patientId: String,
    chiefComplaint: String,
    symptoms: [String],
    observations: String,
    assessment: String,
    plan: String,
    followUp: Schema.Types.Mixed,
    vitals: Schema.Types.Mixed,
    finalizedAt: String,
    updatedAt: { type: String, required: true },
  },
  { versionKey: false, strict: false }
);

export const ConsultationModel =
  mongoose.models.Consultation ?? mongoose.model("Consultation", consultationSchema);

/* ---------- Prescriptions ---------- */

const prescriptionItemSchema = new Schema(
  {},
  { _id: false, strict: false }
);

const prescriptionSchema = new Schema(
  {
    patientId: { type: String, index: true },
    encounterId: { type: String, index: true },
    doctorId: String,
    doctorName: String,
    hospitalId: String,
    items: { type: [prescriptionItemSchema], default: [] },
    instructions: String,
    workflowStatus: {
      type: String,
      enum: ["draft", "finalized", "cancelled"],
      default: "draft",
    },
    status: {
      type: String,
      enum: ["pending", "dispensed", "partially_dispensed", "cancelled"],
      default: "pending",
    },
    dispensedItems: [Schema.Types.Mixed],
    activity: [Schema.Types.Mixed],
    createdAt: String,
    finalizedAt: String,
    updatedAt: String,
  },
  { versionKey: false, strict: false }
);

export const PrescriptionModel =
  mongoose.models.Prescription ?? mongoose.model("Prescription", prescriptionSchema);

/* ---------- Appointments ---------- */

const appointmentSchema = new Schema(
  {
    patientId: { type: String, index: true },
    patientName: String,
    hospitalId: String,
    departmentId: String,
    doctorId: String,
    type: String,
    date: String,
    time: String,
    status: {
      type: String,
      enum: ["scheduled", "confirmed", "checked_in", "completed", "cancelled", "no_show", "rescheduled"],
      default: "scheduled",
    },
    reason: String,
    rescheduledFrom: String,
    rescheduledTo: String,
    tokenNumber: String,
    encounterId: String,
    createdAt: String,
    updatedAt: String,
  },
  { versionKey: false, strict: false }
);

export const AppointmentModel =
  mongoose.models.Appointment ?? mongoose.model("Appointment", appointmentSchema);

/* ---------- Diagnostics ---------- */

const diagnosticOrderSchema = new Schema(
  {
    orderId: String,
    patientId: { type: String, index: true },
    patientName: String,
    encounterId: String,
    doctorId: String,
    doctorName: String,
    hospitalId: String,
    priority: String,
    tests: [Schema.Types.Mixed],
    specimens: [Schema.Types.Mixed],
    results: [Schema.Types.Mixed],
    status: { type: String, default: "ordered" },
    clinicalNotes: String,
    instructions: String,
    orderedAt: String,
    updatedAt: String,
  },
  { versionKey: false, strict: false }
);

export const DiagnosticOrderModel =
  mongoose.models.DiagnosticOrder ?? mongoose.model("DiagnosticOrder", diagnosticOrderSchema);

/* ---------- Medical documents metadata ---------- */

const documentMetaSchema = new Schema(
  {
    fileId: { type: String, index: true },
    patientId: { type: String, index: true },
    hospitalId: String,
    encounterId: String,
    type: String,
    title: String,
    mimeType: String,
    size: Number,
    documentDate: String,
    hospitalName: String,
    departmentName: String,
    uploadedBy: Schema.Types.Mixed,
    source: String,
    version: { type: Number, default: 1 },
    amendedFrom: String,
    amendmentOf: String,
    status: { type: String, enum: ["active", "archived", "deleted"], default: "active" },
    access: Schema.Types.Mixed,
    audit: [Schema.Types.Mixed],
    createdAt: String,
    updatedAt: String,
  },
  { versionKey: false, strict: false }
);

export const DocumentMetaModel =
  mongoose.models.DocumentMeta ?? mongoose.model("DocumentMeta", documentMetaSchema);

/* ---------- Notifications (admin + patient) ---------- */

const notificationSchema = new Schema(
  {
    hospitalId: { type: String, index: true },
    userId: { type: String, index: true },
    audience: { type: String, enum: ["hospital", "patient"], default: "hospital" },
    type: String,
    category: String,
    title: { type: String, required: true },
    message: String,
    priority: String,
    read: { type: Boolean, default: false },
    createdAt: { type: String, required: true },
  },
  { versionKey: false, strict: false }
);

export const NotificationModel =
  mongoose.models.Notification ?? mongoose.model("Notification", notificationSchema);

/* ---------- Admin settings ---------- */

const adminSettingsSchema = new Schema(
  {
    hospitalId: { type: String, required: true, unique: true },
    queueHealthThresholds: {
      warning: { type: Number, default: 10 },
      critical: { type: Number, default: 20 },
    },
    opdOpenTime: { type: String, default: "09:00" },
    opdCloseTime: { type: String, default: "17:00" },
    tokenWindowMinutes: { type: Number, default: 30 },
    updatedAt: String,
    updatedBy: String,
  },
  { versionKey: false }
);

export const AdminSettingsModel =
  (mongoose.models.AdminSettings as Model<AdminSettings>) ??
  mongoose.model("AdminSettings", adminSettingsSchema);

/* ---------- Government alerts ---------- */

const governmentAlertSchema = new Schema(
  {
    districtId: { type: String, required: true, index: true },
    hospitalId: String,
    hospitalName: String,
    departmentName: String,
    severity: { type: String, enum: ["critical", "warning", "info"] },
    type: String,
    message: String,
    createdAt: { type: String, required: true },
    status: { type: String, enum: ["active", "resolved"], default: "active" },
  },
  { versionKey: false }
);

export const GovernmentAlertModel =
  (mongoose.models.GovernmentAlert as Model<GovernmentAlert>) ??
  mongoose.model("GovernmentAlert", governmentAlertSchema);

/* ---------- Priority assessments / overrides / assistance ---------- */

const priorityRecordSchema = new Schema(
  {
    kind: { type: String, enum: ["assessment", "override", "assistance", "audit"], required: true },
    opdId: String,
    tokenNumber: String,
    patientId: String,
    patientName: String,
    requestedBy: Schema.Types.Mixed,
    decidedBy: Schema.Types.Mixed,
    priority: String,
    status: String,
    reason: String,
    outcome: String,
    createdAt: { type: String, required: true },
    resolvedAt: String,
  },
  { versionKey: false, strict: false }
);

priorityRecordSchema.index({ kind: 1, createdAt: -1 });

export const PriorityRecordModel =
  mongoose.models.PriorityRecord ?? mongoose.model("PriorityRecord", priorityRecordSchema);

/* ---------- Security: audit log + security events + consent ---------- */

const auditLogSchema = new Schema(
  {
    actorId: String,
    actorName: String,
    actorRole: String,
    action: String,
    resourceType: String,
    resourceId: String,
    hospitalId: String,
    districtId: String,
    result: { type: String, enum: ["success", "failure"] },
    detail: Schema.Types.Mixed,
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false, strict: false }
);

auditLogSchema.index({ createdAt: -1 });

export const AuditLogModel = mongoose.models.AuditLog ?? mongoose.model("AuditLog", auditLogSchema);

const securityEventSchema = new Schema(
  {
    type: String,
    severity: String,
    message: String,
    meta: Schema.Types.Mixed,
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false, strict: false }
);

export const SecurityEventModel =
  mongoose.models.SecurityEvent ?? mongoose.model("SecurityEvent", securityEventSchema);

const consentSchema = new Schema(
  {
    patientId: { type: String, index: true },
    grantedTo: Schema.Types.Mixed,
    scopes: [String],
    status: { type: String, enum: ["granted", "revoked", "expired"], default: "granted" },
    grantedAt: String,
    expiresAt: String,
    revokedAt: String,
  },
  { versionKey: false, strict: false }
);

export const ConsentModel = mongoose.models.Consent ?? mongoose.model("Consent", consentSchema);

/* ---------- OPD Slots (capacity management) ---------- */

const slotSchema = new Schema(
  {
    opdId: { type: String, required: true },
    hospitalId: { type: String, required: true },
    departmentId: { type: String, required: true },
    doctorId: { type: String, default: "" },
    date: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    capacity: { type: Number, required: true, default: 5 },
    bookedCount: { type: Number, required: true, default: 0 },
    status: { type: String, enum: ["available", "full", "closed"], default: "available" },
  },
  { versionKey: false }
);

slotSchema.index({ opdId: 1, date: 1, startTime: 1 }, { unique: true });
slotSchema.index({ opdId: 1, date: 1, status: 1 });

export const SlotModel =
  mongoose.models.Slot ?? mongoose.model("Slot", slotSchema);

/* ---------- Queue Audit Trail ---------- */

const queueAuditSchema = new Schema(
  {
    opdId: { type: String, required: true },
    tokenNumber: { type: String, required: true },
    patientId: { type: String, default: "" },
    patientName: { type: String, default: "" },
    fromStatus: { type: String, default: "" },
    toStatus: { type: String, required: true },
    actorId: { type: String, default: "" },
    actorRole: { type: String, default: "" },
    timestamp: { type: Date, default: Date.now },
    durationMs: { type: Number, default: 0 },
    metadata: Schema.Types.Mixed,
  },
  { versionKey: false }
);

queueAuditSchema.index({ opdId: 1, timestamp: -1 });
queueAuditSchema.index({ tokenNumber: 1, timestamp: -1 });

export const QueueAuditModel =
  mongoose.models.QueueAudit ?? mongoose.model("QueueAudit", queueAuditSchema);

/* ---------- Schedule Configuration ---------- */

const scheduleConfigSchema = new Schema(
  {
    hospitalId: { type: String, required: true },
    departmentId: { type: String, required: true },
    doctorId: { type: String, default: "" },
    workdays: { type: [Number], default: [1, 2, 3, 4, 5, 6] },
    openTime: { type: String, default: "09:00" },
    closeTime: { type: String, default: "13:00" },
    slotDurationMinutes: { type: Number, default: 15 },
    maxBookingsPerSlot: { type: Number, default: 5 },
    holidays: { type: [String], default: [] },
    supportedTypes: { type: [String], default: ["appointment", "follow_up", "referral"] },
    updatedAt: String,
  },
  { versionKey: false }
);

scheduleConfigSchema.index({ departmentId: 1, doctorId: 1 });

export const ScheduleConfigModel =
  mongoose.models.ScheduleConfig ?? mongoose.model("ScheduleConfig", scheduleConfigSchema);

/* ---------- Medicine catalogue & diagnostics catalogue (reference data) ---------- */

export const MedicineModel =
  mongoose.models.Medicine ?? mongoose.model("Medicine", new Schema({}, { strict: false }));

export const TestCatalogueModel =
  mongoose.models.TestCatalogue ?? mongoose.model("TestCatalogue", new Schema({}, { strict: false }));

/* ---------- Atomic counters ---------- */

const counterSchema = new Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

export const CounterModel = mongoose.models.Counter ?? mongoose.model("Counter", counterSchema);

export async function nextSequence(key: string): Promise<number> {
  const doc = await CounterModel.findByIdAndUpdate(
    key,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  ).lean<{ seq: number } | null>();
  return doc?.seq ?? 1;
}
