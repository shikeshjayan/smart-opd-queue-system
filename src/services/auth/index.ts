import type { AuthResponse, User } from "./types";

const mockUser: User = {
  id: "usr_001",
  name: "Demo Patient",
  email: "patient@example.com",
  role: "patient",
};

const delay = () => new Promise((resolve) => setTimeout(resolve, 300));

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    await delay();
    return { token: `mock-${password.length > 0 ? "jwt" : "invalid"}`, user: { ...mockUser, email } };
  },

  async register(payload: { name: string; email: string; password: string }): Promise<AuthResponse> {
    await delay();
    return { token: "mock-jwt-token", user: { ...mockUser, ...payload } };
  },

  async verify(token: string): Promise<{ verified: boolean }> {
    await delay();
    return { verified: Boolean(token) };
  },

  async forgotPassword(email: string): Promise<{ sent: boolean }> {
    await delay();
    return { sent: email.includes("@") };
  },

  async me(): Promise<User> {
    await delay();
    return mockUser;
  },
};
