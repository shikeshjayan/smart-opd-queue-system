"use server";

import "server-only";
import { dbConnect } from "@/lib/db";
import {
  DepartmentModel,
  HospitalServiceModel,
  RoomModel,
  ScheduleConfigModel,
  ConfigVersionModel,
  nextSequence,
  plain,
  plainList,
} from "@/lib/models";
import { requireHospitalAccess, requirePermission } from "@/server/lib/access";
import { auditOps } from "@/server/lib/audit";
import type { SessionUser } from "@/features/auth/types/auth.types";
import type {
  ConfigVersion,
  Department,
  HospitalService,
  Room,
} from "@/types";

const WORKDAY_TO_NUM: Record<string, number> = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
const NUM_TO_WORKDAY: Record<number, string> = { 0: "sun", 1: "mon", 2: "tue", 3: "wed", 4: "thu", 5: "fri", 6: "sat" };

/* ───────── Departments ───────── */

export async function opsListDepartments(hospitalId: string): Promise<Department[]> {
  await dbConnect();
  await requireHospitalAccess("VIEW_QUEUE", hospitalId);
  const docs = await DepartmentModel.find({ hospitalId }).sort({ name: 1 }).lean();
  return plainList<Department>(docs);
}

export async function opsCreateDepartment(
  hospitalId: string,
  input: { name: string; code?: string }
): Promise<Department> {
  await dbConnect();
  const user = await requireHospitalAccess("MANAGE_DEPARTMENTS", hospitalId);
  const name = input.name.trim();
  if (!name) throw new Error("Department name is required.");
  const code =
    (input.code?.trim().toUpperCase() ||
      name.replace(/[^a-zA-Z]/g, "").slice(0, 6).toUpperCase() ||
      "DEPT");
  const dup = await DepartmentModel.findOne({ hospitalId, code });
  if (dup) throw new Error(`Department code ${code} already exists at this hospital.`);
  const n = await nextSequence("department");
  const doc = await DepartmentModel.create({
    _id: `dep_${String(n).padStart(3, "0")}`,
    hospitalId,
    name,
    code,
    status: "active",
  });
  auditOps(user, {
    action: "department_created",
    resourceType: "department",
    resourceId: String(doc._id),
    hospitalId,
    detail: { name, code },
  });
  return plain<Department>(doc);
}

export async function opsSetDepartmentStatus(
  departmentId: string,
  status: "active" | "inactive"
): Promise<void> {
  await dbConnect();
  const dept = await DepartmentModel.findById(departmentId).lean<{ hospitalId: string }>();
  if (!dept) throw new Error("Department not found.");
  const user = await requireHospitalAccess("MANAGE_DEPARTMENTS", dept.hospitalId);
  // Operational data is never deleted — inactive departments keep history intact.
  await DepartmentModel.updateOne({ _id: departmentId }, { $set: { status } });
  auditOps(user, {
    action: status === "active" ? "department_activated" : "department_disabled",
    resourceType: "department",
    resourceId: departmentId,
    hospitalId: dept.hospitalId,
  });
}

export type OpsDepartmentConfig = {
  id: string;
  hospitalId: string;
  name: string;
  code: string;
  status: "active" | "inactive";
  opdAvailabilityDays: string[];
  serviceIds: string[];
  dailyCapacity: number | null;
  avgConsultationMinutes: number | null;
  appointmentAllocationPct: number | null;
  walkInAllocationPct: number | null;
};

/** Partial update payload — only provided fields are written. */
export type OpsDepartmentConfigInput = Pick<OpsDepartmentConfig, "id"> &
  Partial<
    Omit<
      OpsDepartmentConfig,
      "id" | "hospitalId"
    >
  > & { hospitalId?: string };

export async function opsListDepartmentConfigs(hospitalId: string): Promise<OpsDepartmentConfig[]> {
  await dbConnect();
  await requireHospitalAccess("VIEW_QUEUE", hospitalId);
  const [departments, services, schedules] = await Promise.all([
    DepartmentModel.find({ hospitalId }).sort({ name: 1 }).lean<Record<string, unknown>[]>(),
    HospitalServiceModel.find({ hospitalId, departmentId: { $ne: null } })
      .select("_id departmentId")
      .lean<{ _id: string; departmentId: string | null }[]>(),
    ScheduleConfigModel.find({ hospitalId })
      .select("departmentId workdays")
      .lean<{ departmentId: string; workdays: number[] }[]>(),
  ]);
  return departments.map((d) => {
    const id = String(d._id);
    const schedule = schedules.find((s) => s.departmentId === id);
    return {
      id,
      hospitalId: String(d.hospitalId),
      name: String(d.name ?? ""),
      code: String(d.code ?? ""),
      status: (d.status as "active" | "inactive") ?? "active",
      opdAvailabilityDays: (schedule?.workdays ?? [])
        .map((n) => NUM_TO_WORKDAY[n] ?? "")
        .filter(Boolean),
      serviceIds: services.filter((s) => s.departmentId === id).map((s) => s._id),
      dailyCapacity: (d.dailyCapacity as number | null) ?? null,
      avgConsultationMinutes: (d.avgConsultationMinutes as number | null) ?? null,
      appointmentAllocationPct: (d.appointmentAllocationPct as number | null) ?? null,
      walkInAllocationPct: (d.walkInAllocationPct as number | null) ?? null,
    };
  });
}

export async function opsSaveDepartmentConfig(
  config: OpsDepartmentConfigInput
): Promise<OpsDepartmentConfig> {
  await dbConnect();
  const dept = await DepartmentModel.findById(config.id).lean<Record<string, unknown>>();
  if (!dept) throw new Error("Department not found.");
  const hospitalId = String(dept.hospitalId);
  const user = await requireHospitalAccess("MANAGE_DEPARTMENTS", hospitalId);
  const before: Record<string, unknown> = { ...dept };

  const set: Record<string, unknown> = {};
  if (config.name !== undefined && config.name !== dept.name) set.name = config.name.trim();
  if (config.code !== undefined && config.code !== dept.code) {
    const code = config.code.trim().toUpperCase();
    const dup = await DepartmentModel.findOne({ hospitalId, code, _id: { $ne: config.id } });
    if (dup) throw new Error(`Department code ${code} already exists at this hospital.`);
    set.code = code;
  }
  if (config.dailyCapacity !== undefined) set.dailyCapacity = config.dailyCapacity;
  if (config.avgConsultationMinutes !== undefined) set.avgConsultationMinutes = config.avgConsultationMinutes;
  if (config.appointmentAllocationPct !== undefined) set.appointmentAllocationPct = config.appointmentAllocationPct;
  if (config.walkInAllocationPct !== undefined) set.walkInAllocationPct = config.walkInAllocationPct;

  const changes: Array<{ field: string; before: unknown; after: unknown }> = Object.entries(set)
    .filter(([field, after]) => (before[field] ?? null) !== after)
    .map(([field, after]) => ({ field, before: before[field] ?? null, after }));

  if (Object.keys(set).length > 0) {
    await DepartmentModel.updateOne({ _id: config.id }, { $set: set });
  }

  if (config.serviceIds) {
    await HospitalServiceModel.updateMany(
      { hospitalId, departmentId: config.id },
      { $set: { departmentId: null } }
    );
    if (config.serviceIds.length > 0) {
      await HospitalServiceModel.updateMany(
        { hospitalId, _id: { $in: config.serviceIds } },
        { $set: { departmentId: config.id } }
      );
    }
  }

  if (config.opdAvailabilityDays) {
    const nums = [
      ...new Set(config.opdAvailabilityDays.map((d) => WORKDAY_TO_NUM[d] ?? -1)),
    ].filter((n) => n >= 0);
    const schedules = await ScheduleConfigModel.find({ hospitalId, departmentId: config.id })
      .select("workdays")
      .lean<{ workdays: number[] }[]>();
    const beforeDays = JSON.stringify(schedules[0]?.workdays ?? []);
    const afterDays = JSON.stringify(nums);
    await ScheduleConfigModel.updateMany(
      { hospitalId, departmentId: config.id },
      { $set: { workdays: nums } }
    );
    if (beforeDays !== afterDays) {
      changes.push({ field: "opdAvailabilityDays", before: beforeDays, after: afterDays });
    }
  }

  changes.sort((a, b) => a.field.localeCompare(b.field));
  if (changes.length > 0) {
    await writeConfigVersion(user, hospitalId, "department_capacity", config.id, changes, "Department configuration updated");
  }

  auditOps(user, {
    action: "department_updated",
    resourceType: "department",
    resourceId: config.id,
    hospitalId,
    detail: { changes },
  });

  return (await opsListDepartmentConfigs(hospitalId)).find((c) => c.id === config.id)!;
}

async function writeConfigVersion(
  user: SessionUser,
  hospitalId: string,
  entity: ConfigVersion["entity"],
  entityId: string,
  changes: Array<{ field: string; before: unknown; after: unknown }>,
  note?: string
): Promise<void> {
  const n = await nextSequence("configversion");
  await ConfigVersionModel.create({
    _id: `cfv_${String(n).padStart(4, "0")}`,
    hospitalId,
    entity,
    entityId,
    changes,
    note,
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    createdAt: new Date().toISOString(),
  });
}

export async function opsListConfigVersions(
  hospitalId: string,
  entity: ConfigVersion["entity"],
  entityId?: string
): Promise<ConfigVersion[]> {
  await dbConnect();
  await requireHospitalAccess("VIEW_OPERATIONAL_AUDIT", hospitalId);
  const query: Record<string, unknown> = { hospitalId, entity };
  if (entityId) query.entityId = entityId;
  const docs = await ConfigVersionModel.find(query).sort({ createdAt: -1 }).limit(50).lean();
  return plainList<ConfigVersion>(docs);
}

/* ───────── Services ───────── */

export async function opsListServices(hospitalId: string): Promise<HospitalService[]> {
  await dbConnect();
  await requireHospitalAccess("VIEW_QUEUE", hospitalId);
  const docs = await HospitalServiceModel.find({ hospitalId }).sort({ name: 1 }).lean();
  return plainList<HospitalService>(docs);
}

export async function opsSaveService(
  entry: {
    id?: string;
    hospitalId: string;
    name: string;
    code: string;
    category?: HospitalService["category"];
    departmentId?: string | null;
    description?: string;
    status?: "active" | "inactive";
  }
): Promise<HospitalService> {
  await dbConnect();
  const user = await requireHospitalAccess("MANAGE_SERVICES", entry.hospitalId);
  const code = entry.code.trim().toUpperCase();
  const base = {
    hospitalId: entry.hospitalId,
    name: entry.name.trim(),
    code,
    category: entry.category ?? "opd",
    departmentId: entry.departmentId ?? null,
    description: entry.description,
    status: entry.status ?? "active",
  };
  let doc;
  if (entry.id) {
    doc = await HospitalServiceModel.findOneAndUpdate({ _id: entry.id }, { $set: base }, { new: true });
  } else {
    const dup = await HospitalServiceModel.findOne({ hospitalId: entry.hospitalId, code });
    if (dup) throw new Error(`Service code ${code} already exists at this hospital.`);
    const n = await nextSequence("hospitalservice");
    doc = await HospitalServiceModel.create({ _id: `svc_${String(n).padStart(3, "0")}`, ...base });
  }
  if (!doc) throw new Error("Service not found.");
  auditOps(user, {
    action: "service_updated",
    resourceType: "hospital_service",
    resourceId: String(doc._id),
    hospitalId: entry.hospitalId,
    detail: { name: base.name, code, status: base.status },
  });
  return plain<HospitalService>(doc);
}

export async function opsToggleServiceStatus(id: string): Promise<HospitalService | null> {
  await dbConnect();
  const svc = await HospitalServiceModel.findById(id).lean<{ hospitalId: string; status: string }>();
  if (!svc) return null;
  const user = await requireHospitalAccess("MANAGE_SERVICES", svc.hospitalId);
  const status = svc.status === "active" ? "inactive" : "active";
  const doc = await HospitalServiceModel.findByIdAndUpdate(id, { $set: { status } }, { new: true });
  auditOps(user, {
    action: "service_updated",
    resourceType: "hospital_service",
    resourceId: id,
    hospitalId: svc.hospitalId,
    detail: { status },
  });
  return doc ? plain<HospitalService>(doc) : null;
}

/* ───────── Rooms ───────── */

export async function opsListRooms(hospitalId: string): Promise<Room[]> {
  await dbConnect();
  await requireHospitalAccess("VIEW_QUEUE", hospitalId);
  const docs = await RoomModel.find({ hospitalId }).sort({ code: 1 }).lean();
  return plainList<Room>(docs);
}

export async function opsSaveRoom(
  room: {
    id?: string;
    hospitalId: string;
    code: string;
    name?: string;
    type?: Room["type"];
    departmentId?: string | null;
    floor?: string;
    status?: Room["status"];
  }
): Promise<Room> {
  await dbConnect();
  const user = await requireHospitalAccess("MANAGE_ROOMS", room.hospitalId);
  const code = room.code.trim().toUpperCase();
  const base = {
    hospitalId: room.hospitalId,
    code,
    name: room.name?.trim() || undefined,
    type: room.type ?? "opd",
    departmentId: room.departmentId ?? null,
    floor: room.floor?.trim() || undefined,
    status: room.status ?? "active",
  };
  let doc;
  if (room.id) {
    doc = await RoomModel.findOneAndUpdate({ _id: room.id }, { $set: base }, { new: true });
  } else {
    const dup = await RoomModel.findOne({ hospitalId: room.hospitalId, code });
    if (dup) throw new Error(`Room ${code} already exists at this hospital.`);
    const n = await nextSequence("room");
    doc = await RoomModel.create({ _id: `room_${String(n).padStart(3, "0")}`, ...base });
  }
  if (!doc) throw new Error("Room not found.");
  auditOps(user, {
    action: "room_updated",
    resourceType: "room",
    resourceId: String(doc._id),
    hospitalId: room.hospitalId,
    detail: { code, type: base.type, status: base.status },
  });
  return plain<Room>(doc);
}

export async function opsSetRoomStatus(id: string, status: Room["status"]): Promise<Room | null> {
  await dbConnect();
  const room = await RoomModel.findById(id).lean<{ hospitalId: string }>();
  if (!room) return null;
  const user = await requireHospitalAccess("MANAGE_ROOMS", room.hospitalId);
  const doc = await RoomModel.findByIdAndUpdate(id, { $set: { status } }, { new: true });
  auditOps(user, {
    action: "room_status_changed",
    resourceType: "room",
    resourceId: id,
    hospitalId: room.hospitalId,
    detail: { status },
  });
  return doc ? plain<Room>(doc) : null;
}
