export type Role = "patient" | "doctor" | "hospital-admin" | "district-admin" | "state-admin";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type AuthResponse = {
  token: string;
  user: User;
};
