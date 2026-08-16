import { adminService } from "@/services/admin";
import { hospitalService } from "@/services/hospital";
import type { AdminNotification, AdminSettings, Hospital } from "@/types";
import type {
  AdminDashboardData,
  AdminDepartmentDetail,
  AdminDoctorDetail,
  AdminOpdDetail,
  AdminPatientDetail,
  AdminReport,
  AdminSettingsInput,
} from "@/services/admin/types";

export const adminMockApi = {
  async getProfile() {
    return adminService.getProfile();
  },

  async listHospitals(): Promise<Hospital[]> {
    return adminService.listHospitals();
  },

  async getDashboard(hospitalId: string): Promise<AdminDashboardData> {
    return adminService.getDashboard(hospitalId);
  },

  async getQueueOverview(hospitalId: string) {
    return adminService.getQueueOverview(hospitalId);
  },

  async listDepartments(hospitalId: string) {
    return adminService.listDepartments(hospitalId);
  },

  async addDepartment(hospitalId: string, name: string) {
    return adminService.addDepartment(hospitalId, name);
  },

  async setDepartmentStatus(id: string, status: "active" | "inactive") {
    return adminService.setDepartmentStatus(id, status);
  },

  async getDepartmentDetail(
    hospitalId: string,
    departmentId: string
  ): Promise<AdminDepartmentDetail | null> {
    return adminService.getDepartmentDetail(hospitalId, departmentId);
  },

  async listOpds(hospitalId: string) {
    return adminService.listOpds(hospitalId);
  },

  async addOpd(input: {
    departmentId: string;
    name: string;
    startTime: string;
    endTime: string;
  }) {
    return adminService.addOpd(input);
  },

  async setOpdStatus(id: string, status: "open" | "closed" | "full" | "unavailable") {
    return adminService.setOpdStatus(id, status);
  },

  async getOpdDetail(hospitalId: string, opdId: string): Promise<AdminOpdDetail | null> {
    return adminService.getOpdDetail(hospitalId, opdId);
  },

  async listDoctors(hospitalId: string) {
    return adminService.listDoctors(hospitalId);
  },

  async addDoctor(input: {
    hospitalId: string;
    departmentId: string;
    name: string;
    speciality: string;
    phone: string;
    email: string;
  }) {
    return adminService.addDoctor(input);
  },

  async setDoctorStatus(id: string, status: "active" | "inactive") {
    return adminService.setDoctorStatus(id, status);
  },

  async getDoctorDetail(hospitalId: string, doctorId: string): Promise<AdminDoctorDetail | null> {
    return adminService.getDoctorDetail(hospitalId, doctorId);
  },

  async listStaff(hospitalId: string) {
    return adminService.listStaff(hospitalId);
  },

  async listPatients(hospitalId: string) {
    return adminService.listPatients(hospitalId);
  },

  async getPatientDetail(
    hospitalId: string,
    patientId: string
  ): Promise<AdminPatientDetail | null> {
    return adminService.getPatientDetail(hospitalId, patientId);
  },

  async getReports(hospitalId: string): Promise<AdminReport> {
    return adminService.getReports(hospitalId);
  },

  async getSettings(hospitalId: string): Promise<AdminSettings> {
    return adminService.getSettings(hospitalId);
  },

  async saveSettings(hospitalId: string, input: AdminSettingsInput): Promise<AdminSettings> {
    return adminService.saveSettings(hospitalId, input);
  },

  async listNotifications(hospitalId: string): Promise<AdminNotification[]> {
    return adminService.listNotifications(hospitalId);
  },

  async markNotificationRead(id: string) {
    return adminService.markNotificationRead(id);
  },

  async markAllNotificationsRead(hospitalId: string) {
    return adminService.markAllNotificationsRead(hospitalId);
  },

  async getHospital(id: string): Promise<Hospital | undefined> {
    return hospitalService.getById(id);
  },
};
