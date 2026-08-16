import { governmentService } from "@/services/government";
import type { DistrictId } from "@/config/districts";
import type {
  GovernmentAlert,
  GovernmentAlertSeverity,
  GovernmentAlertStatus,
  Hospital,
  DistrictPerformance,
} from "@/types";
import type {
  DistrictDashboardData,
  GovernmentHospitalDetail,
  GovernmentHospitalRow,
  GovernmentQueueItem,
  GovernmentReport,
  GovernmentReportFilters,
  QueueMonitorFilters,
  StateDashboardData,
} from "@/services/government/types";

export const governmentMockApi = {
  async getDistrictProfile() {
    return governmentService.getDistrictProfile();
  },

  async getStateProfile() {
    return governmentService.getStateProfile();
  },

  async listDistricts(): Promise<DistrictPerformance[]> {
    return governmentService.listDistricts();
  },

  async getDistrictPerformance(districtId: DistrictId): Promise<DistrictPerformance> {
    return governmentService.getDistrictPerformance(districtId);
  },

  async getStateDashboard(): Promise<StateDashboardData> {
    return governmentService.getStateDashboard();
  },

  async getDistrictDashboard(districtId: DistrictId): Promise<DistrictDashboardData> {
    return governmentService.getDistrictDashboard(districtId);
  },

  async listHospitalsByDistrict(districtId: DistrictId): Promise<GovernmentHospitalRow[]> {
    return governmentService.listHospitalsByDistrict(districtId);
  },

  async getHospitalDetail(hospitalId: string): Promise<GovernmentHospitalDetail | null> {
    return governmentService.getHospitalDetail(hospitalId);
  },

  async listQueueMonitor(
    districtIds: DistrictId[],
    filters: QueueMonitorFilters = {}
  ): Promise<GovernmentQueueItem[]> {
    return governmentService.listQueueMonitor(districtIds, filters);
  },

  async listAlerts(
    districtIds: DistrictId[] | null,
    filters: {
      hospitalId?: string;
      severity?: GovernmentAlertSeverity | "";
      status?: GovernmentAlertStatus | "";
    } = {}
  ): Promise<GovernmentAlert[]> {
    return governmentService.listAlerts(districtIds, filters);
  },

  async getReport(
    scope: "state" | "district",
    districtId: DistrictId | null,
    filters: GovernmentReportFilters = {}
  ): Promise<GovernmentReport> {
    return governmentService.getReport(scope, districtId, filters);
  },

  async listHospitals(): Promise<Hospital[]> {
    return governmentService.listHospitals();
  },

  async listHospitalRows(): Promise<GovernmentHospitalRow[]> {
    return governmentService.listHospitalRows();
  },
};
