import "server-only";

import { StaffLeaveModel, HospitalClosureModel } from "@/lib/models";

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Weekday number (0 = Sunday … 6 = Saturday) from a YYYY-MM-DD string. */
export function weekdayOf(date: string): number {
  return new Date(`${date}T00:00:00`).getDay();
}

/** True when the doctor holds an approved leave covering this date. */
export async function isDoctorOnLeave(staffId: string, date: string): Promise<boolean> {
  if (!staffId) return false;
  const onLeave = await StaffLeaveModel.findOne({
    staffId,
    status: "approved",
    fromDate: { $lte: date },
    toDate: { $gte: date },
  })
    .select("_id")
    .lean();
  return Boolean(onLeave);
}

/**
 * True when the department is not operating on this date:
 * workday mismatch, schedule holiday, or an approved hospital/
 * department closure covering the date.
 */
export async function isOperatingDay(
  date: string,
  hospitalId: string,
  departmentId: string,
  config: { workdays: number[]; holidays?: string[] }
): Promise<boolean> {
  if (!config.workdays.includes(weekdayOf(date))) return false;
  if (Array.isArray(config.holidays) && config.holidays.includes(date)) return false;

  const closure = await HospitalClosureModel.findOne({
    hospitalId,
    status: { $in: ["planned", "active"] },
    fromDate: { $lte: date },
    toDate: { $gte: date },
    $or: [{ scope: "hospital" }, { scope: "department", departmentId }],
  })
    .select("_id")
    .lean();
  return !closure;
}
