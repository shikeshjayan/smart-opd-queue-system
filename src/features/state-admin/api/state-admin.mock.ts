import { stateAdminService } from "@/services/state";
import type {
  StateStats,
  DistrictComparisonRow,
  StateHospitalRow,
  StateServiceAvailabilityRow,
  StateCapacityRow,
  StateAnnouncement,
  StateAuditEvent,
  StateFilters,
} from "../types/state-admin.types";

export const stateAdminMockApi = {
  async getStats(): Promise<StateStats> {
    return stateAdminService.getStateStats();
  },
  async listDistrictComparison(): Promise<DistrictComparisonRow[]> {
    return stateAdminService.listDistrictComparison();
  },
  async listHospitalDirectory(filters: StateFilters & { query?: string }): Promise<StateHospitalRow[]> {
    return stateAdminService.listHospitalDirectory(filters);
  },
  async getServiceAvailability(): Promise<StateServiceAvailabilityRow[]> {
    return stateAdminService.getServiceAvailability();
  },
  async getCapacityByDistrict(): Promise<StateCapacityRow[]> {
    return stateAdminService.getCapacityByDistrict();
  },
  async listAnnouncements(): Promise<StateAnnouncement[]> {
    return stateAdminService.listAnnouncements();
  },
  async publishAnnouncement(
    input: Omit<StateAnnouncement, "id" | "status" | "createdAt" | "publishedBy">,
    actor: { id: string; name: string; role: string }
  ): Promise<StateAnnouncement> {
    return stateAdminService.publishAnnouncement(input, actor);
  },
  async getAuditLog(): Promise<StateAuditEvent[]> {
    return stateAdminService.getAuditLog();
  },
};
