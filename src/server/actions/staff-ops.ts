"use server";

import "server-only";
import { dbConnect } from "@/lib/db";
import {
  StaffModel,
  DoctorModel,
  UserModel,
  StaffAssignmentModel,
  StaffLeaveModel,
  AppointmentModel,
  nextSequence,
  plain,
  plainList,
} from "@/lib/models";
import { requireHospitalAccess, requirePermission, assertHospitalScope } from "@/server/lib/access";
import { requireSession } from "@/lib/auth";
import { auditOps } from "@/server/lib/audit";
import { notify } from "@/server/notifications/service";
import { broadcastToServer } from "@/features/realtime/server/broadcast";
import type { SessionUser } from "@/features/auth/types/auth.types";
import type { StaffAssignment, StaffLeave } from "@/types";

export type StaffOperationalStatus = "active" | "on_leave" | "offline";

export type OpsStaffRow = {
  id: string;
  name: string;
  role: string;
  departmentId: string | null;
  phone: string;
  email: string;
  status: "active" | "inactive";
  joinedAt?: string;
  operationalStatus: StaffOperationalStatus;
  activeAssignmentCount: number;
};

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

async function computeOperationalStatus(
  staffId: string,
  hospitalId: string
): Promise<StaffOperationalStatus> {
  const today = todayISO();
  const onLeave = await StaffLeaveModel.findOne({
    staffId,
    hospitalId,
    status: "approved",
    fromDate: { $lte: today },
    toDate: { $gte: today },
  })
    .select("_id")
    .lean();
  if (onLeave) return "on_leave";
  const active = await StaffAssignmentModel.findOne({ staffId, hospitalId, status: "active" })
    .select("_id")
    .lean();
  return active ? "active" : "offline";
}

/* ───────── Staff directory ───────── */

export async function opsListStaff(hospitalId: string): Promise<OpsStaffRow[]> {
  await dbConnect();
  await requireHospitalAccess("VIEW_QUEUE", hospitalId);

  const [staffDocs, doctorDocs] = await Promise.all([
    StaffModel.find({ hospitalId }).lean<Record<string, unknown>[]>(),
    DoctorModel.find({ hospitalId }).lean<Record<string, unknown>[]>(),
  ]);

  const rows: Array<Omit<OpsStaffRow, "operationalStatus" | "activeAssignmentCount">> = [
    ...doctorDocs.map((d) => ({
      id: String(d._id),
      name: String(d.name ?? ""),
      role: "doctor",
      departmentId: (d.departmentId as string) ?? null,
      phone: (d.phone as string) ?? "",
      email: (d.email as string) ?? "",
      status: ((d.status as "active" | "inactive") ?? "active"),
      joinedAt: d.joinedAt as string | undefined,
    })),
    ...staffDocs.map((s) => ({
      id: String(s._id),
      name: String(s.name ?? ""),
      role: String(s.role ?? "staff"),
      departmentId: null,
      phone: (s.phone as string) ?? "",
      email: (s.email as string) ?? "",
      status: ((s.status as "active" | "inactive") ?? "active"),
      joinedAt: s.joinedAt as string | undefined,
    })),
  ];

  const withStatus = await Promise.all(
    rows.map(async (row) => ({
      ...row,
      operationalStatus: await computeOperationalStatus(row.id, hospitalId),
    }))
  );
  const assignments = await StaffAssignmentModel.find({ hospitalId, status: "active" })
    .select("staffId")
    .lean<{ staffId: string }[]>();
  const countByStaff = new Map<string, number>();
  for (const a of assignments) {
    countByStaff.set(a.staffId, (countByStaff.get(a.staffId) ?? 0) + 1);
  }
  return withStatus.map((row) => ({
    ...row,
    activeAssignmentCount: countByStaff.get(row.id) ?? 0,
  }));
}

/* ───────── Assignments ───────── */

export async function opsListAssignments(staffId: string): Promise<StaffAssignment[]> {
  await dbConnect();
  const user = await requirePermission("VIEW_QUEUE");
  const docs = await StaffAssignmentModel.find({ staffId }).sort({ createdAt: -1 }).lean();
  for (const doc of docs) {
    if ((doc as unknown as { hospitalId: string }).hospitalId) {
      await assertHospitalScope(user, (doc as unknown as { hospitalId: string }).hospitalId);
    }
  }
  return plainList<StaffAssignment>(docs);
}

export async function opsCreateAssignment(input: {
  hospitalId: string;
  staffId: string;
  departmentId?: string | null;
  role: string;
  startDate: string;
  endDate?: string | null;
}): Promise<StaffAssignment> {
  await dbConnect();
  const user = await requireHospitalAccess("MANAGE_STAFF", input.hospitalId);
  const n = await nextSequence("staffassignment");
  const now = new Date().toISOString();
  const doc = await StaffAssignmentModel.create({
    _id: `asg_${String(n).padStart(4, "0")}`,
    staffId: input.staffId,
    hospitalId: input.hospitalId,
    departmentId: input.departmentId ?? null,
    role: input.role,
    startDate: input.startDate,
    endDate: input.endDate ?? null,
    status: "active",
    createdAt: now,
    updatedAt: now,
  });
  auditOps(user, {
    action: "staff_assigned",
    resourceType: "staff_assignment",
    resourceId: String(doc._id),
    hospitalId: input.hospitalId,
    detail: { staffId: input.staffId, role: input.role, departmentId: input.departmentId },
  });
  return plain<StaffAssignment>(doc);
}

export async function opsEndAssignment(assignmentId: string): Promise<void> {
  await dbConnect();
  const asg = await StaffAssignmentModel.findById(assignmentId).lean<{ hospitalId: string }>();
  if (!asg) throw new Error("Assignment not found.");
  const user = await requireHospitalAccess("MANAGE_STAFF", (asg as unknown as { hospitalId: string }).hospitalId);
  await StaffAssignmentModel.updateOne(
    { _id: assignmentId },
    { $set: { status: "inactive", endDate: todayISO(), updatedAt: new Date().toISOString() } }
  );
  auditOps(user, {
    action: "staff_removed",
    resourceType: "staff_assignment",
    resourceId: assignmentId,
    hospitalId: (asg as unknown as { hospitalId: string }).hospitalId,
  });
}

/* ───────── Leave management ───────── */

export async function opsRequestLeave(input: {
  hospitalId: string;
  staffId?: string;
  fromDate: string;
  toDate: string;
  reason: string;
}): Promise<StaffLeave> {
  await dbConnect();
  const session = await requireSession();
  let user: SessionUser;
  let staffId: string;

  if (input.staffId && input.staffId !== session.id) {
    // Admin filing on behalf of a staff member
    user = await requireHospitalAccess("MANAGE_STAFF", input.hospitalId);
    staffId = input.staffId;
  } else {
    // Staff requesting own leave
    user = await requirePermission("REQUEST_LEAVE");
    staffId = session.id;
    await assertHospitalScope(user, input.hospitalId);
  }

  if (input.toDate < input.fromDate) throw new Error("Leave end date is before start date.");
  const n = await nextSequence("staffleave");
  const doc = await StaffLeaveModel.create({
    _id: `lv_${String(n).padStart(4, "0")}`,
    staffId,
    hospitalId: input.hospitalId,
    fromDate: input.fromDate,
    toDate: input.toDate,
    reason: input.reason.trim(),
    status: "pending",
    createdAt: new Date().toISOString(),
  });
  auditOps(user, {
    action: "leave_requested",
    resourceType: "staff_leave",
    resourceId: String(doc._id),
    hospitalId: input.hospitalId,
    detail: { staffId, fromDate: input.fromDate, toDate: input.toDate },
  });
  return plain<StaffLeave>(doc);
}

export async function opsListLeaves(
  hospitalId: string,
  status?: StaffLeave["status"]
): Promise<Array<StaffLeave & { staffName: string }>> {
  await dbConnect();
  await requireHospitalAccess("VIEW_QUEUE", hospitalId);
  const query: Record<string, unknown> = { hospitalId };
  if (status) query.status = status;
  const docs = await StaffLeaveModel.find(query).sort({ createdAt: -1 }).limit(100).lean<
    Record<string, unknown>[]
  >();
  const [staffDocs, doctorDocs] = await Promise.all([
    StaffModel.find({ hospitalId }).select("_id name").lean<Record<string, unknown>[]>(),
    DoctorModel.find({ hospitalId }).select("_id name").lean<Record<string, unknown>[]>(),
  ]);
  const names = new Map<string, string>();
  for (const d of [...doctorDocs, ...staffDocs]) {
    names.set(String(d._id), String(d.name ?? ""));
  }
  return docs.map((d) => ({
    ...(plain<StaffLeave>(d) as StaffLeave),
    staffName: names.get(String(d.staffId)) ?? String(d.staffId),
  }));
}

export async function opsReviewLeave(leaveId: string, approve: boolean): Promise<void> {
  await dbConnect();
  const leave = await StaffLeaveModel.findById(leaveId).lean<Record<string, unknown>>();
  if (!leave) throw new Error("Leave request not found.");
  const hospitalId = String(leave.hospitalId);
  const user = await requireHospitalAccess("APPROVE_LEAVE", hospitalId);
  const now = new Date().toISOString();

  await StaffLeaveModel.updateOne(
    { _id: leaveId, status: "pending" },
    {
      $set: {
        status: approve ? "approved" : "rejected",
        reviewedBy: user.id,
        reviewedAt: now,
      },
    }
  );

  if (approve) {
    // Notify the staff member (if they have a login identity)
    const hasUser = await UserModel.findById(String(leave.staffId)).select("_id").lean();
    if (hasUser) {
      await notify({
        userId: String(leave.staffId),
        templateKey: "STAFF_LEAVE_APPROVED",
        params: { from: String(leave.fromDate), to: String(leave.toDate), staffId: String(leave.staffId) },
        hospitalId,
        audience: "staff",
        resourceType: "staff_leave",
        resourceId: leaveId,
        sentBy: user.id,
      });
    }
    await broadcastToServer({
      type: "STAFF_LEAVE_APPROVED",
      at: now,
      hospitalId,
      actorId: user.id,
      resourceType: "staff_leave",
      resourceId: leaveId,
    });
    // Availability recalculation happens lazily: slot generation and session
    // materialization exclude approved leave ranges at read time.
  }

  auditOps(user, {
    action: approve ? "leave_approved" : "leave_rejected",
    resourceType: "staff_leave",
    resourceId: leaveId,
    hospitalId,
    detail: { staffId: leave.staffId, fromDate: leave.fromDate, toDate: leave.toDate },
  });
}

export async function opsCancelLeave(leaveId: string): Promise<void> {
  await dbConnect();
  const leave = await StaffLeaveModel.findById(leaveId).lean<Record<string, unknown>>();
  if (!leave) throw new Error("Leave request not found.");
  const hospitalId = String(leave.hospitalId);
  const user =
    String(leave.staffId) === (await requireSession()).id
      ? await requirePermission("REQUEST_LEAVE")
      : await requireHospitalAccess("MANAGE_STAFF", hospitalId);
  await assertHospitalScope(user, hospitalId);

  const result = await StaffLeaveModel.updateOne(
    { _id: leaveId, status: { $in: ["pending", "approved"] } },
    { $set: { status: "cancelled", reviewedBy: user.id, reviewedAt: new Date().toISOString() } }
  );
  if (result.matchedCount === 0) throw new Error("Only pending or approved leave can be cancelled.");

  auditOps(user, {
    action: "leave_cancelled",
    resourceType: "staff_leave",
    resourceId: leaveId,
    hospitalId,
  });
}

/** Future appointments affected by an approved/pending leave — feeds reschedule/cancel workflow. */
export async function opsLeaveImpact(leaveId: string): Promise<{
  total: number;
  appointments: Array<{
    id: string;
    patientName: string;
    date: string;
    time: string;
    status: string;
    departmentId: string | null;
  }>;
}> {
  await dbConnect();
  const leave = await StaffLeaveModel.findById(leaveId).lean<Record<string, unknown>>();
  if (!leave) throw new Error("Leave request not found.");
  const hospitalId = String(leave.hospitalId);
  await requireHospitalAccess("MANAGE_APPOINTMENTS", hospitalId);

  const docs = await AppointmentModel.find({
    hospitalId,
    doctorId: String(leave.staffId),
    date: { $gte: String(leave.fromDate), $lte: String(leave.toDate) },
    status: { $in: ["scheduled", "confirmed"] },
  })
    .sort({ date: 1, time: 1 })
    .limit(200)
    .lean<Record<string, unknown>[]>();

  return {
    total: docs.length,
    appointments: docs.map((a) => ({
      id: String(a._id),
      patientName: String(a.patientName ?? ""),
      date: String(a.date ?? ""),
      time: String(a.time ?? ""),
      status: String(a.status ?? ""),
      departmentId: (a.departmentId as string) ?? null,
    })),
  };
}
