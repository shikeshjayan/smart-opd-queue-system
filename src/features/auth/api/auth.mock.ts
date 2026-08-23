import {
  staffLogin as staffLoginAction,
  verifyPatientOtp,
  requestPatientOtp,
  restoreSession,
  logoutAction,
} from "@/server/actions/auth";

const delay = () => new Promise((resolve) => setTimeout(resolve, 300));

export const authMockApi = {
  async requestPatientOtp(phone: string) {
    await delay();
    return requestPatientOtp(phone);
  },

  async verifyPatientOtp(phone: string, otp: string) {
    await delay();
    return verifyPatientOtp(phone, otp);
  },

  async staffLogin(staffId: string, password: string) {
    await delay();
    return staffLoginAction(staffId, password);
  },

  async restore() {
    await delay();
    return restoreSession();
  },

  async logout() {
    await delay();
    await logoutAction();
  },
};
