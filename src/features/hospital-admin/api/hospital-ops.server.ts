import {
  opsCreateDepartment,
  opsListServices,
  opsListDepartmentConfigs,
  opsSaveDepartmentConfig,
  opsSaveService,
  opsToggleServiceStatus,
  opsSetDepartmentStatus,
  opsListRooms,
  opsSaveRoom,
  opsSetRoomStatus,
  type OpsDepartmentConfig,
  type OpsDepartmentConfigInput,
} from "@/server/actions/hospital-ops";
import type { HospitalServiceEntry } from "@/services/hospital-ops/types";
import type { Room } from "@/types";

function serviceToEntry(s: Awaited<ReturnType<typeof opsListServices>>[number]): HospitalServiceEntry {
  return {
    id: s.id,
    hospitalId: s.hospitalId,
    name: s.name,
    code: s.code,
    departmentId: s.departmentId ?? undefined,
    status: s.status,
    availability: s.description ?? "",
  };
}

function entryToInput(entry: HospitalServiceEntry) {
  return {
    id: entry.id || undefined,
    hospitalId: entry.hospitalId,
    name: entry.name,
    code: entry.code,
    departmentId: entry.departmentId ?? null,
    description: entry.availability || undefined,
    status: entry.status,
  };
}

export const hospitalOpsServerApi = {
  async listRooms(hospitalId: string): Promise<Room[]> {
    try {
      return await opsListRooms(hospitalId);
    } catch {
      return [];
    }
  },

  async saveRoom(room: Parameters<typeof opsSaveRoom>[0]): Promise<Room | null> {
    return opsSaveRoom(room);
  },

  async setRoomStatus(id: string, status: Room["status"]): Promise<Room | null> {
    return opsSetRoomStatus(id, status);
  },

  async listServices(hospitalId: string): Promise<HospitalServiceEntry[]> {
    try {
      const services = await opsListServices(hospitalId);
      return services.map(serviceToEntry);
    } catch {
      return [];
    }
  },

  async saveService(entry: HospitalServiceEntry): Promise<HospitalServiceEntry | null> {
    const saved = await opsSaveService(entryToInput(entry));
    return saved ? serviceToEntry(saved) : null;
  },

  async toggleServiceStatus(id: string): Promise<HospitalServiceEntry | null> {
    const updated = await opsToggleServiceStatus(id);
    return updated ? serviceToEntry(updated) : null;
  },

  async listDepartmentConfigs(hospitalId: string): Promise<OpsDepartmentConfig[]> {
    try {
      return await opsListDepartmentConfigs(hospitalId);
    } catch {
      return [];
    }
  },

  async saveDepartmentConfig(config: OpsDepartmentConfigInput): Promise<OpsDepartmentConfig> {
    return opsSaveDepartmentConfig(config);
  },

  async createDepartment(hospitalId: string, name: string): Promise<void> {
    await opsCreateDepartment(hospitalId, { name });
  },

  async setDepartmentStatus(departmentId: string, status: "active" | "inactive"): Promise<void> {
    await opsSetDepartmentStatus(departmentId, status);
  },
};

export type { OpsDepartmentConfig, OpsDepartmentConfigInput };
