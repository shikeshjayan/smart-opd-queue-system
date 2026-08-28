import mongoose, { Schema, type Model } from "mongoose";
import type {
  AdminNotification,
  AdminSettings,
  ConfigVersion,
  CurrentHospitalCapacity,
  DailyDistrictMetrics,
  DailyHospitalMetrics,
  DailyStateMetrics,
  Department,
  District,
  DistrictConfig,
  DoctorRecord,
  Encounter,
  GovernmentAlert,
  Hospital,
  HospitalClosure,
  HospitalConfig,
  HospitalService,
  OPD,
  OpdSession,
  OutboxEvent,
  PatientSummary,
  Room,
  ShiftTemplate,
  StaffAssignment,
  StaffLeave,
  StaffMember,
  StateSettings,
  AuditLog,
  Announcement,
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
        "lab_reviewer",
        "pharmacist",
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
    code: { type: String, required: true, unique: true },
    district: { type: String, required: true, index: true },
    address: String,
    phone: String,
    emergencyContact: String,
    type: { type: String, enum: ["general", "district", "taluk", "specialty", "medical_college"], default: "general" },
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
    code: { type: String, required: true },
    waitingCount: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    dailyCapacity: { type: Number, default: null },
    avgConsultationMinutes: { type: Number, default: null },
    appointmentAllocationPct: { type: Number, default: null },
    walkInAllocationPct: { type: Number, default: null },
  },
  { versionKey: false }
);
departmentSchema.index({ hospitalId: 1, code: 1 }, { unique: true });

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

/* ---------- Phase 26 — Hospital Operations & Staff Management ---------- */

const staffAssignmentSchema = new Schema(
  {
    _id: { type: String, required: true },
    staffId: { type: String, required: true, index: true },
    hospitalId: { type: String, required: true, index: true },
    departmentId: { type: String, default: null },
    role: { type: String, required: true },
    startDate: { type: String, required: true },
    endDate: { type: String, default: null },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    createdAt: String,
    updatedAt: String,
  },
  { versionKey: false }
);

const staffLeaveSchema = new Schema(
  {
    _id: { type: String, required: true },
    staffId: { type: String, required: true, index: true },
    hospitalId: { type: String, required: true, index: true },
    departmentId: { type: String, default: null },
    fromDate: { type: String, required: true },
    toDate: { type: String, required: true },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled"],
      default: "pending",
    },
    reviewedBy: { type: String, default: null },
    reviewedAt: { type: String, default: null },
    createdAt: String,
  },
  { versionKey: false }
);
staffLeaveSchema.index({ hospitalId: 1, fromDate: 1, toDate: 1 });

const roomSchema = new Schema(
  {
    _id: { type: String, required: true },
    hospitalId: { type: String, required: true, index: true },
    code: { type: String, required: true },
    name: String,
    type: {
      type: String,
      enum: ["opd", "lab", "radiology", "procedure", "pharmacy", "other"],
      default: "opd",
    },
    departmentId: { type: String, default: null },
    floor: String,
    status: { type: String, enum: ["active", "inactive", "maintenance"], default: "active" },
  },
  { versionKey: false }
);
roomSchema.index({ hospitalId: 1, code: 1 }, { unique: true });

const hospitalServiceSchema = new Schema(
  {
    _id: { type: String, required: true },
    hospitalId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    code: { type: String, required: true },
    category: {
      type: String,
      enum: ["opd", "laboratory", "radiology", "pharmacy", "emergency", "other"],
      default: "opd",
    },
    departmentId: { type: String, default: null },
    description: String,
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { versionKey: false }
);
hospitalServiceSchema.index({ hospitalId: 1, code: 1 }, { unique: true });

const shiftTemplateSchema = new Schema(
  {
    _id: { type: String, required: true },
    hospitalId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    departmentId: { type: String, default: null },
    breakMinutes: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { versionKey: false }
);

export const OpdSessionStates = [
  "scheduled",
  "open",
  "active",
  "paused",
  "completed",
  "cancelled",
] as const;

const opdSessionSchema = new Schema(
  {
    _id: { type: String, required: true },
    hospitalId: { type: String, required: true, index: true },
    departmentId: { type: String, required: true, index: true },
    opdId: { type: String, required: true, index: true },
    doctorId: { type: String, default: null },
    roomId: { type: String, default: null },
    shiftId: { type: String, default: null },
    date: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    state: {
      type: String,
      enum: OpdSessionStates,
      default: "scheduled",
      index: true,
    },
    plannedCapacity: { type: Number, default: 0 },
    tokensIssued: { type: Number, default: 0 },
    tokensCompleted: { type: Number, default: 0 },
    pauseReason: { type: String, default: null },
    expectedResumeAt: { type: String, default: null },
    pausedAt: { type: String, default: null },
    resumedAt: { type: String, default: null },
    openedAt: { type: String, default: null },
    completedAt: { type: String, default: null },
    cancelledAt: { type: String, default: null },
    cancelReason: { type: String, default: null },
    createdAt: String,
  },
  { versionKey: false }
);
opdSessionSchema.index({ opdId: 1, date: 1, startTime: 1 });
opdSessionSchema.index({ hospitalId: 1, date: 1 });

const hospitalClosureSchema = new Schema(
  {
    _id: { type: String, required: true },
    hospitalId: { type: String, required: true, index: true },
    scope: { type: String, enum: ["hospital", "department"], default: "hospital" },
    departmentId: { type: String, default: null },
    type: { type: String, enum: ["holiday", "maintenance", "emergency"], required: true },
    fromDate: { type: String, required: true },
    toDate: { type: String, required: true },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ["planned", "active", "resolved", "cancelled"],
      default: "planned",
    },
    affectedTotal: { type: Number, default: 0 },
    affectedRescheduled: { type: Number, default: 0 },
    affectedCancelled: { type: Number, default: 0 },
    createdBy: String,
    createdByName: String,
    createdAt: String,
  },
  { versionKey: false }
);
hospitalClosureSchema.index({ hospitalId: 1, fromDate: 1, toDate: 1 });

const configVersionSchema = new Schema(
  {
    _id: { type: String, required: true },
    hospitalId: { type: String, required: true, index: true },
    entity: {
      type: String,
      enum: ["adminsettings", "scheduleconfig", "department_capacity", "hospital_profile"],
      required: true,
    },
    entityId: { type: String, required: true },
    changes: { type: [], default: [] },
    note: String,
    actorId: String,
    actorName: String,
    actorRole: String,
    createdAt: String,
  },
  { versionKey: false }
);
configVersionSchema.index({ hospitalId: 1, entity: 1, entityId: 1, createdAt: -1 });

export const StaffAssignmentModel =
  (mongoose.models.StaffAssignment as Model<StaffAssignment>) ??
  mongoose.model("StaffAssignment", staffAssignmentSchema);

export const StaffLeaveModel =
  (mongoose.models.StaffLeave as Model<StaffLeave>) ??
  mongoose.model("StaffLeave", staffLeaveSchema);

export const RoomModel =
  (mongoose.models.Room as Model<Room>) ?? mongoose.model("Room", roomSchema);

export const HospitalServiceModel =
  (mongoose.models.HospitalService as Model<HospitalService>) ??
  mongoose.model("HospitalService", hospitalServiceSchema);

export const ShiftTemplateModel =
  (mongoose.models.ShiftTemplate as Model<ShiftTemplate>) ??
  mongoose.model("ShiftTemplate", shiftTemplateSchema);

export const OpdSessionModel =
  (mongoose.models.OpdSession as Model<OpdSession>) ??
  mongoose.model("OpdSession", opdSessionSchema);

export const HospitalClosureModel =
  (mongoose.models.HospitalClosure as Model<HospitalClosure>) ??
  mongoose.model("HospitalClosure", hospitalClosureSchema);

export const ConfigVersionModel =
  (mongoose.models.ConfigVersion as Model<ConfigVersion>) ??
  mongoose.model("ConfigVersion", configVersionSchema);

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
  sessionId?: string | null;
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
    sessionId: { type: String, default: null, index: true },
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

/* ---------- Consultation audit trail ---------- */

const consultationAuditSchema = new Schema(
  {
    encounterId: { type: String, required: true, index: true },
    actorId: String,
    actorName: String,
    action: String,
    timestamp: { type: Date, default: Date.now },
    detail: Schema.Types.Mixed,
  },
  { versionKey: false }
);

consultationAuditSchema.index({ encounterId: 1, timestamp: 1 });

export const ConsultationAuditModel =
  mongoose.models.ConsultationAudit ?? mongoose.model("ConsultationAudit", consultationAuditSchema);

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

/* ---------- Prescription audit trail ---------- */

const prescriptionAuditSchema = new Schema(
  {
    prescriptionId: { type: String, required: true, index: true },
    action: String,
    actorId: String,
    detail: Schema.Types.Mixed,
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

export const PrescriptionAuditModel =
  mongoose.models.PrescriptionAudit ?? mongoose.model("PrescriptionAudit", prescriptionAuditSchema);

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

const diagnosticResultSchema = new Schema(
  {
    _id: { type: String, required: true },
    orderId: { type: String, required: true, index: true },
    testId: String,
    testName: String,
    category: String,
    patientId: String,
    status: { type: String, enum: ["draft", "submitted_for_verification", "verified", "published", "preliminary", "final", "amended", "cancelled"], default: "draft" },
    values: [Schema.Types.Mixed],
    notes: String,
    finalizedAt: String,
    amendedFrom: String,
    createdAt: String,
    updatedAt: String,
  },
  { versionKey: false, strict: false }
);

export const DiagnosticResultModel =
  mongoose.models.DiagnosticResult ?? mongoose.model("DiagnosticResult", diagnosticResultSchema);

const diagnosticAuditSchema = new Schema(
  {
    resultId: String,
    orderId: String,
    action: String,
    actorId: String,
    createdAt: { type: String, required: true },
  },
  { versionKey: false }
);

export const DiagnosticAuditModel =
  mongoose.models.DiagnosticAudit ?? mongoose.model("DiagnosticAudit", diagnosticAuditSchema);

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

/* ---------- Notifications (Phase 25) ---------- */

const notificationSchema = new Schema(
  {
    hospitalId: { type: String, index: true },
    userId: { type: String, index: true },
    audience: { type: String, enum: ["hospital", "patient", "staff"], default: "patient" },
    // templateKey e.g. APPOINTMENT_CONFIRMED, QUEUE_TOKEN_CALLED
    templateKey: { type: String, index: true },
    category: { type: String, index: true }, // appointment | queue | clinical | followup | announcement | system
    title: { type: String, required: true },
    message: String,
    bodyEn: String,
    bodyMl: String,
    locale: { type: String, default: "en" },
    priority: { type: String, default: "normal" }, // normal | important | critical
    required: { type: Boolean, default: false },
    read: { type: Boolean, default: false },
    readAt: String,
    deepLink: String,
    resourceType: String,
    resourceId: String,
    channels: [String],
    idempotencyKey: { type: String, index: true },
    dueAt: String,
    targetScope: Schema.Types.Mixed,
    sentBy: String,
    createdAt: { type: String, required: true, index: true },
  },
  { versionKey: false, strict: false }
);

notificationSchema.index({ idempotencyKey: 1 }, { unique: true, sparse: true });

export const NotificationModel =
  mongoose.models.Notification ?? mongoose.model("Notification", notificationSchema);

const notificationDeliverySchema = new Schema(
  {
    notificationId: { type: String, required: true, index: true },
    channel: { type: String, required: true }, // in_app | sms | push | email
    state: {
      type: String,
      enum: ["pending", "processing", "sent", "delivered", "failed", "read"],
      default: "pending",
    },
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 3 },
    lastError: String,
    providerMessageId: String,
    sentAt: String,
    deliveredAt: String,
    readAt: String,
    updatedAt: String,
  },
  { versionKey: false, strict: false }
);

export const NotificationDeliveryModel =
  mongoose.models.NotificationDelivery ??
  mongoose.model("NotificationDelivery", notificationDeliverySchema);

const notificationJobSchema = new Schema(
  {
    payload: Schema.Types.Mixed,
    state: {
      type: String,
      enum: ["queued", "processing", "done", "dead"],
      default: "queued",
      index: true,
    },
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 3 },
    runAfter: { type: Date, index: true },
    lockedAt: Date,
    leaseExpiresAt: Date,
    lastError: String,
    idempotencyKey: { type: String, index: true },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false, strict: false }
);

export const NotificationJobModel =
  mongoose.models.NotificationJob ?? mongoose.model("NotificationJob", notificationJobSchema);

const notificationPreferenceSchema = new Schema(
  {
    patientId: { type: String, required: true, unique: true },
    sms: { type: Boolean, default: true },
    email: { type: Boolean, default: false },
    push: { type: Boolean, default: true },
    appointmentReminders: { type: Boolean, default: true },
    queueUpdates: { type: Boolean, default: true },
    resultNotifications: { type: Boolean, default: true },
    prescriptionNotifications: { type: Boolean, default: true },
    followUpReminders: { type: Boolean, default: true },
    announcements: { type: Boolean, default: true },
    locale: { type: String, default: "en" },
    phoneVerified: { type: Boolean, default: false },
    updatedAt: String,
  },
  { versionKey: false, strict: false }
);

export const NotificationPreferenceModel =
  mongoose.models.NotificationPreference ??
  mongoose.model("NotificationPreference", notificationPreferenceSchema);

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

/* ---------- Pharmacy: batch-level medicine stock (§14/§15) ---------- */

const medicineStockSchema = new Schema(
  {
    // Deterministic id: "{hospitalId}:{medicineId}:{batchNumber}"
    _id: { type: String, required: true },
    stockId: { type: String, required: true },
    medicineId: { type: String, required: true },
    hospitalId: { type: String, required: true },
    batchNumber: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0 },
    expiryDate: { type: String, required: true }, // YYYY-MM-DD
    unit: { type: String, default: "units" },
    status: {
      type: String,
      enum: ["available", "expired", "blocked"],
      default: "available",
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

medicineStockSchema.index({ hospitalId: 1, medicineId: 1, status: 1, expiryDate: 1 });
medicineStockSchema.index({ hospitalId: 1, medicineId: 1, batchNumber: 1 }, { unique: true });

export const MedicineStockModel =
  mongoose.models.MedicineStock ?? mongoose.model("MedicineStock", medicineStockSchema);

/* ---------- Pharmacy: immutable stock transaction ledger (§18) ---------- */

const stockTransactionSchema = new Schema(
  {
    txId: { type: String, required: true },
    stockId: { type: String, required: true },
    medicineId: { type: String, required: true },
    medicineName: String,
    hospitalId: { type: String, required: true },
    type: {
      type: String,
      enum: ["received", "dispensed", "damaged", "expired", "adjusted", "blocked", "unblocked"],
      required: true,
    },
    /** positive = in, negative = out */
    delta: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    batchNumber: String,
    prescriptionId: String,
    note: String,
    actorId: String,
    actorName: String,
    actorRole: String,
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

stockTransactionSchema.index({ medicineId: 1, createdAt: -1 });
stockTransactionSchema.index({ stockId: 1, createdAt: -1 });
stockTransactionSchema.index({ hospitalId: 1, createdAt: -1 });

export const StockTransactionModel =
  mongoose.models.StockTransaction ?? mongoose.model("StockTransaction", stockTransactionSchema);

/* ---------- Pharmacy audit trail (§21) ---------- */

const pharmacyAuditSchema = new Schema(
  {
    action: { type: String, required: true },
    actorId: String,
    actorName: String,
    actorRole: String,
    prescriptionId: String,
    stockId: String,
    medicineId: String,
    detail: Schema.Types.Mixed,
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

pharmacyAuditSchema.index({ prescriptionId: 1, createdAt: -1 });
pharmacyAuditSchema.index({ createdAt: -1 });

export const PharmacyAuditModel =
  mongoose.models.PharmacyAudit ?? mongoose.model("PharmacyAudit", pharmacyAuditSchema);

/* ---------- Diagnostics service slots (configurable scheduling, §9) ---------- */

const diagnosticSlotSchema = new Schema(
  {
    _id: { type: String, required: true },
    slotId: { type: String, required: true },
    testId: { type: String, required: true },
    hospitalId: { type: String, required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    startTime: { type: String, required: true }, // HH:mm
    endTime: String,
    durationMinutes: { type: Number, default: 20 },
    capacity: { type: Number, default: 1 },
    bookedCount: { type: Number, default: 0 },
    status: { type: String, enum: ["available", "full", "closed"], default: "available" },
  },
  { versionKey: false }
);

diagnosticSlotSchema.index({ testId: 1, hospitalId: 1, date: 1, startTime: 1 }, { unique: true });
diagnosticSlotSchema.index({ testId: 1, hospitalId: 1, date: 1, status: 1 });

export const DiagnosticSlotModel =
  mongoose.models.DiagnosticSlot ?? mongoose.model("DiagnosticSlot", diagnosticSlotSchema);

/* ---------- Per-hospital inventory config (low-stock minimums, §19) ---------- */

const inventoryConfigSchema = new Schema(
  {
    hospitalId: { type: String, required: true },
    medicineId: { type: String, required: true },
    medicineName: String,
    minLevel: { type: Number, default: 100 },
    updatedAt: String,
  },
  { versionKey: false }
);

inventoryConfigSchema.index({ hospitalId: 1, medicineId: 1 }, { unique: true });

export const InventoryConfigModel =
  mongoose.models.InventoryConfig ?? mongoose.model("InventoryConfig", inventoryConfigSchema);

/* ---------- Phase 27 — Governance Models ---------- */

const STATE_ID = "KERALA";

/* District master entity */
const districtSchema = new Schema(
  {
    _id: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    stateId: { type: String, required: true, default: STATE_ID },
    headquarters: {
      lat: Number,
      lng: Number,
    },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

districtSchema.index({ code: 1 }, { unique: true });
districtSchema.index({ stateId: 1, status: 1 });

export const DistrictModel =
  mongoose.models.District ?? mongoose.model("District", districtSchema);

/* State Settings (singleton per state) */
const stateSettingsSchema = new Schema(
  {
    _id: { type: String, required: true, default: "STATE_CONFIG" },
    stateId: { type: String, required: true, default: STATE_ID },
    appointmentRules: {
      defaultDuration: { type: Number, default: 15 },
      maxAdvanceDays: { type: Number, default: 30 },
      cancellationPolicy: { type: String, default: "24h" },
    },
    queueRules: {
      priorityWeights: { type: Map, of: Number, default: { emergency: 3, priority: 2, normal: 1 } },
      thresholdAlerts: {
        warning: { type: Number, default: 20 },
        critical: { type: Number, default: 40 },
      },
    },
    notificationPolicies: {
      channels: { type: [String], default: ["email", "sms", "push"] },
      templates: { type: Map, of: String, default: {} },
    },
    supportedLanguages: { type: [String], default: ["en", "ml"] },
    securityPolicies: {
      sessionTimeout: { type: Number, default: 3600 },
      mfaRequired: { type: Boolean, default: false },
      ipWhitelist: { type: [String], default: [] },
    },
    featureFlags: { type: Map, of: Boolean, default: {} },
    auditPolicies: {
      retentionDays: { type: Number, default: 2555 },
      logLevel: { type: String, default: "info" },
    },
    medicalRecordRetention: {
      years: { type: Number, default: 7 },
      archiveStrategy: { type: String, default: "cold_storage" },
    },
    updatedAt: { type: Date, default: Date.now },
    updatedBy: String,
  },
  { versionKey: false }
);

export const StateSettingsModel =
  mongoose.models.StateSettings ?? mongoose.model("StateSettings", stateSettingsSchema);

/* District Configuration Override */
const districtConfigSchema = new Schema(
  {
    _id: { type: String, required: true },
    districtId: { type: String, required: true, unique: true },
    overrides: Schema.Types.Mixed,
    effectiveSettings: Schema.Types.Mixed,
    updatedAt: { type: Date, default: Date.now },
    updatedBy: String,
  },
  { versionKey: false }
);

districtConfigSchema.index({ districtId: 1 }, { unique: true });

export const DistrictConfigModel =
  mongoose.models.DistrictConfig ?? mongoose.model("DistrictConfig", districtConfigSchema);

/* Hospital Configuration Override */
const hospitalConfigSchema = new Schema(
  {
    _id: { type: String, required: true },
    hospitalId: { type: String, required: true, unique: true },
    overrides: Schema.Types.Mixed,
    effectiveSettings: Schema.Types.Mixed,
    updatedAt: { type: Date, default: Date.now },
    updatedBy: String,
  },
  { versionKey: false }
);

hospitalConfigSchema.index({ hospitalId: 1 }, { unique: true });

export const HospitalConfigModel =
  mongoose.models.HospitalConfig ?? mongoose.model("HospitalConfig", hospitalConfigSchema);

/* Outbox Event for reliable event processing */
const outboxEventSchema = new Schema(
  {
    _id: { type: String, required: true },
    aggregateType: { type: String, required: true },
    aggregateId: { type: String, required: true },
    eventType: { type: String, required: true },
    payload: { type: Schema.Types.Mixed, required: true },
    occurredAt: { type: Date, required: true },
    processedAt: Date,
    retryCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
      index: true,
    },
  },
  { versionKey: false }
);

outboxEventSchema.index({ status: 1, occurredAt: 1 });
outboxEventSchema.index({ aggregateType: 1, aggregateId: 1 });

export const OutboxEventModel =
  mongoose.models.OutboxEvent ?? mongoose.model("OutboxEvent", outboxEventSchema);

/* Materialized Metrics — Daily Hospital Metrics */
const dailyHospitalMetricsSchema = new Schema(
  {
    _id: { type: String, required: true },
    hospitalId: { type: String, required: true, index: true },
    districtId: { type: String, required: true, index: true },
    date: { type: String, required: true, index: true },
    totalAppointments: { type: Number, default: 0 },
    totalVisits: { type: Number, default: 0 },
    totalWaiting: { type: Number, default: 0 },
    appointments: { type: Number, default: 0 },
    walkIns: { type: Number, default: 0 },
    completedVisits: { type: Number, default: 0 },
    noShows: { type: Number, default: 0 },
    avgWaitMinutes: { type: Number, default: 0 },
    avgConsultationMinutes: { type: Number, default: 0 },
    departmentBreakdown: [
      {
        departmentId: String,
        departmentName: String,
        visits: { type: Number, default: 0 },
        avgWaitMinutes: { type: Number, default: 0 },
      },
    ],
    queueHealth: [
      {
        opdId: String,
        waiting: { type: Number, default: 0 },
        completed: { type: Number, default: 0 },
        avgWaitMinutes: { type: Number, default: 0 },
      },
    ],
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

dailyHospitalMetricsSchema.index({ hospitalId: 1, date: -1 }, { unique: true });
dailyHospitalMetricsSchema.index({ districtId: 1, date: -1 });

export const DailyHospitalMetricsModel =
  mongoose.models.DailyHospitalMetrics ?? mongoose.model("DailyHospitalMetrics", dailyHospitalMetricsSchema);

/* Materialized Metrics — Daily District Metrics */
const dailyDistrictMetricsSchema = new Schema(
  {
    _id: { type: String, required: true },
    districtId: { type: String, required: true, index: true },
    date: { type: String, required: true, index: true },
    hospitals: { type: Number, default: 0 },
    totalVisits: { type: Number, default: 0 },
    completedVisits: { type: Number, default: 0 },
    appointments: { type: Number, default: 0 },
    walkIns: { type: Number, default: 0 },
    totalWaiting: { type: Number, default: 0 },
    avgWaitMinutes: { type: Number, default: 0 },
    hospitalsByStatus: {
      normal: { type: Number, default: 0 },
      highLoad: { type: Number, default: 0 },
      critical: { type: Number, default: 0 },
    },
    departmentBreakdown: [
      {
        departmentId: String,
        departmentName: String,
        visits: { type: Number, default: 0 },
      },
    ],
    topDepartments: [
      {
        departmentId: String,
        departmentName: String,
        visits: { type: Number, default: 0 },
      },
    ],
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

dailyDistrictMetricsSchema.index({ districtId: 1, date: -1 }, { unique: true });

export const DailyDistrictMetricsModel =
  mongoose.models.DailyDistrictMetrics ?? mongoose.model("DailyDistrictMetrics", dailyDistrictMetricsSchema);

/* Materialized Metrics — Daily State Metrics */
const dailyStateMetricsSchema = new Schema(
  {
    _id: { type: String, required: true },
    stateId: { type: String, required: true, default: STATE_ID },
    date: { type: String, required: true, index: true },
    districts: { type: Number, default: 0 },
    hospitals: { type: Number, default: 0 },
    totalVisits: { type: Number, default: 0 },
    completedVisits: { type: Number, default: 0 },
    appointments: { type: Number, default: 0 },
    walkIns: { type: Number, default: 0 },
    avgWaitMinutes: { type: Number, default: 0 },
    noShowRate: { type: Number, default: 0 },
    hospitalUtilization: { type: Number, default: 0 },
    districtBreakdown: [
      {
        districtId: String,
        districtName: String,
        visits: { type: Number, default: 0 },
        avgWaitMinutes: { type: Number, default: 0 },
      },
    ],
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

dailyStateMetricsSchema.index({ stateId: 1, date: -1 }, { unique: true });

export const DailyStateMetricsModel =
  mongoose.models.DailyStateMetrics ?? mongoose.model("DailyStateMetrics", dailyStateMetricsSchema);

/* Real-time Capacity Read Model */
const currentHospitalCapacitySchema = new Schema(
  {
    _id: { type: String, required: true },
    hospitalId: { type: String, required: true, index: true },
    departmentId: { type: String, required: true, index: true },
    availableSlots: { type: Number, default: 0 },
    occupiedSlots: { type: Number, default: 0 },
    waitingCount: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

currentHospitalCapacitySchema.index({ hospitalId: 1, departmentId: 1 }, { unique: true });

export const CurrentHospitalCapacityModel =
  mongoose.models.CurrentHospitalCapacity ?? mongoose.model("CurrentHospitalCapacity", currentHospitalCapacitySchema);

/* ---------- Announcements (state/district broadcasts) ---------- */

const announcementSchema = new Schema(
  {
    _id: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    targetType: {
      type: String,
      enum: ["all", "districts", "hospitals"],
      required: true,
    },
    targetIds: { type: [String], default: [] },
    districtId: { type: String, default: null },
    hospitalId: { type: String, default: null },
    audience: { type: String, enum: ["hospitals", "departments", "staff", "patients"], default: "hospitals" },
    publishedAt: { type: String, default: null },
    scheduledAt: { type: String, default: null },
    expiresAt: { type: String, default: null },
    publishedBy: { type: String, required: true },
    status: {
      type: String,
      enum: ["draft", "scheduled", "published", "expired"],
      default: "draft",
    },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
  },
  { versionKey: false }
);

announcementSchema.index({ targetType: 1, status: 1 });
announcementSchema.index({ districtId: 1, status: 1 });
announcementSchema.index({ hospitalId: 1, status: 1 });
announcementSchema.index({ scheduledAt: 1, status: 1 });
announcementSchema.index({ publishedAt: -1 });

export const AnnouncementModel =
  (mongoose.models.Announcement as Model<Announcement>) ??
  mongoose.model<Announcement>("Announcement", announcementSchema);
