
import "server-only";
import { dbConnect } from "@/lib/db";
import {
  DistrictModel,
  HospitalModel,
  StaffModel,
  DoctorModel,
  UserModel,
  plain,
  plainList,
} from "@/lib/models";
import type { SessionUser } from "@/features/auth/types/auth.types";
import { getPermissionsForRole } from "@/features/auth/permissions";
import { createAccessContext, type AccessContext } from "./access-context";

const STATE_ID = "KERALA";

async function getAllDistrictIds(): Promise<string[]> {
  await dbConnect();
  const districts = await DistrictModel.find({ status: "active" }, { _id: 1 }).lean();
  return districts.map(d => String(d._id));
}

async function getAllHospitalIds(): Promise<string[]> {
  await dbConnect();
  const hospitals = await HospitalModel.find({ status: "active" }, { _id: 1 }).lean();
  return hospitals.map(h => String(h._id));
}

async function getHospitalIdsForDistrict(districtId: string): Promise<string[]> {
  await dbConnect();
  const hospitals = await HospitalModel.find({ districtId, status: "active" } as any, { _id: 1 }).lean();
  return hospitals.map(h => String(h._id));
}

async function getDistrictForHospital(hospitalId: string): Promise<string | null> {
  await dbConnect();
  const hospital = await HospitalModel.findById(hospitalId, { districtId: 1 }).lean();
  return hospital ? plain<{ districtId: string }>(hospital).districtId : null;
}

async function getDepartmentIdsForHospital(hospitalId: string): Promise<string[]> {
  await dbConnect();
  const { DepartmentModel } = await import("@/lib/models");
  const departments = await DepartmentModel.find({ hospitalId, status: "active" }, { _id: 1 }).lean();
  return departments.map(d => String(d._id));
}

async function getDistrictAssignment(userId: string): Promise<{ districtId: string } | null> {
  await dbConnect();
  const user = await UserModel.findById(userId).lean();
  if (user?.scope?.districtId) {
    return { districtId: user.scope.districtId };
  }
  return null;
}

async function getStaffByUserId(userId: string) {
  await dbConnect();
  return StaffModel.findOne({ userId }).lean();
}

async function getDoctorByUserId(userId: string) {
  await dbConnect();
  return DoctorModel.findOne({ userId }).lean();
}

export async function resolveAccessContext(session: SessionUser): Promise<AccessContext> {
  await dbConnect();
  
  const base = {
    userId: session.id,
    role: session.role,
    stateId: STATE_ID,
    permissions: [...getPermissionsForRole(session.role)],
    districtIds: [] as string[],
    hospitalIds: [] as string[],
    departmentIds: [] as string[],
  };

  switch (session.role) {
    case "state_admin": {
      const [districtIds, hospitalIds] = await Promise.all([
        getAllDistrictIds(),
        getAllHospitalIds(),
      ]);
      base.districtIds = districtIds;
      base.hospitalIds = hospitalIds;
      base.departmentIds = await getDepartmentIdsForHospital(hospitalIds[0] || "");
      break;
    }

    case "district_admin": {
      const assignment = await getDistrictAssignment(session.id);
      if (!assignment) {
        throw new Error(`No district assignment found for user ${session.id}`);
      }
      base.districtIds = [assignment.districtId];
      base.hospitalIds = await getHospitalIdsForDistrict(assignment.districtId);
      break;
    }

    case "hospital_admin": {
      const staff = await getStaffByUserId(session.id);
      if (!staff) {
        throw new Error(`No staff record found for user ${session.id}`);
      }
      const hospitalId = plain<{ hospitalId: string }>(staff).hospitalId;
      base.hospitalIds = [hospitalId];
      base.districtIds = [await getDistrictForHospital(hospitalId) || ""];
      base.departmentIds = await getDepartmentIdsForHospital(hospitalId);
      break;
    }

    case "doctor": {
      const doctor = await getDoctorByUserId(session.id);
      if (!doctor) {
        throw new Error(`No doctor record found for user ${session.id}`);
      }
      const doc = plain<{ hospitalId: string; departmentId: string }>(doctor);
      base.hospitalIds = [doc.hospitalId];
      base.departmentIds = [doc.departmentId];
      const districtId = await getDistrictForHospital(doc.hospitalId);
      if (districtId) base.districtIds = [districtId];
      break;
    }

    case "patient": {
      const user = await UserModel.findById(session.id).lean();
      if (user?.scope?.hospitalId) {
        base.hospitalIds = [user.scope.hospitalId];
        const districtId = await getDistrictForHospital(user.scope.hospitalId);
        if (districtId) base.districtIds = [districtId];
      }
      break;
    }
  }

  return createAccessContext(base);
}

export async function resolveAccessContextForServerAction(session: SessionUser): Promise<AccessContext> {
  return resolveAccessContext(session);
}