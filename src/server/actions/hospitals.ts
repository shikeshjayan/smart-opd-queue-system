"use server";

import "server-only";
import { dbConnect } from "@/lib/db";
import { HospitalModel, DepartmentModel, OpdModel, DoctorModel, StaffModel } from "@/lib/models";
import type { Hospital, Department, OPD, DoctorRecord, StaffMember } from "@/types";
import { plain, plainList } from "@/lib/models";

export async function listHospitals(): Promise<Hospital[]> {
  await dbConnect();
  const docs = await HospitalModel.find({ status: "active" }).lean();
  return plainList<Hospital>(docs);
}

export async function getHospital(id: string): Promise<Hospital | null> {
  await dbConnect();
  const doc = await HospitalModel.findOne({ _id: id }).lean();
  return plain<Hospital>(doc);
}

export async function listHospitalsByDistrict(districtId: string): Promise<Hospital[]> {
  await dbConnect();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const docs = await (HospitalModel as any).find({ district: districtId, status: "active" }).lean();
  return plainList<Hospital>(docs);
}

export async function listDepartments(hospitalId: string): Promise<Department[]> {
  await dbConnect();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const docs = await (DepartmentModel as any).find({ hospitalId, status: "active" }).lean();
  return plainList<Department>(docs);
}

export async function getDepartment(id: string): Promise<Department | null> {
  await dbConnect();
  const doc = await DepartmentModel.findOne({ _id: id }).lean();
  return plain<Department>(doc);
}

export async function listOpds(departmentId: string): Promise<OPD[]> {
  await dbConnect();
  const docs = await OpdModel.find({ departmentId }).lean();
  return plainList<OPD>(docs);
}

export async function listOpdsByHospital(hospitalId: string): Promise<OPD[]> {
  await dbConnect();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const depDocs = await (DepartmentModel as any).find({ hospitalId }).lean();
  const deptIds = (depDocs as Array<{ _id: string }>).map((d) => d._id);
  if (!deptIds.length) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const docs = await (OpdModel as any).find({ departmentId: { $in: deptIds } }).lean();
  return plainList<OPD>(docs);
}

export async function getOpd(id: string): Promise<OPD | null> {
  await dbConnect();
  const doc = await OpdModel.findOne({ _id: id }).lean();
  return plain<OPD>(doc);
}

export async function listDoctorsByHospital(hospitalId: string): Promise<DoctorRecord[]> {
  await dbConnect();
  const docs = await DoctorModel.find({ hospitalId, status: "active" }).lean();
  return plainList<DoctorRecord>(docs);
}

export async function getDoctorRecord(id: string): Promise<DoctorRecord | null> {
  await dbConnect();
  const doc = await DoctorModel.findOne({ _id: id }).lean();
  return plain<DoctorRecord>(doc);
}

export async function listStaffByHospital(hospitalId: string): Promise<StaffMember[]> {
  await dbConnect();
  const docs = await StaffModel.find({ hospitalId }).lean();
  return plainList<StaffMember>(docs);
}
