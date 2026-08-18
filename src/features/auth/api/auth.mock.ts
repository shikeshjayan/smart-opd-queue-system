import { authService } from "@/services/auth";
import type { UserRole } from "../types/auth.types";

const delay = () => new Promise((resolve) => setTimeout(resolve, 300));

export const authMockApi = {
  async listDemoAccounts() {
    await delay();
    return authService.listDemoAccounts();
  },

  async requestPatientOtp(phone: string) {
    await delay();
    return authService.requestPatientOtp(phone);
  },

  async verifyPatientOtp(phone: string, otp: string) {
    await delay();
    return authService.verifyPatientOtp(phone, otp);
  },

  async staffLogin(staffId: string, password: string) {
    await delay();
    return authService.staffLogin(staffId, password);
  },

  async demoLogin(role: UserRole) {
    await delay();
    return authService.demoLogin(role);
  },

  async restore() {
    await delay();
    return authService.restore();
  },

  async logout() {
    await delay();
    authService.logout();
  },
};