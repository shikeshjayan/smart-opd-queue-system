import type { UserRole } from "@/features/auth/types/auth.types";

export type MfaMethod = "totp" | "sms_otp";

export type MfaEnrollment = {
  userId: string;
  method: MfaMethod;
  enrolledAt: string;
  verified: boolean;
};

const PRIVILEGED_ROLES: readonly UserRole[] = ["hospital_admin", "district_admin", "state_admin"];

export function mfaRequiredFor(role: UserRole): boolean {
  return PRIVILEGED_ROLES.includes(role);
}

let enrollments: MfaEnrollment[] = [
  {
    userId: "sadm_001",
    method: "totp",
    enrolledAt: "2026-08-01T10:00:00.000Z",
    verified: true,
  },
];

export const mfaService = {
  listEnrollments(userId: string): MfaEnrollment[] {
    return enrollments.filter((e) => e.userId === userId);
  },

  isEnrolled(userId: string): boolean {
    return enrollments.some((e) => e.userId === userId && e.verified);
  },

  enroll(userId: string, method: MfaMethod): MfaEnrollment {
    enrollments = enrollments.filter((e) => e.userId !== userId);
    const enrollment: MfaEnrollment = {
      userId,
      method,
      enrolledAt: new Date().toISOString(),
      verified: true,
    };
    enrollments.push(enrollment);
    return enrollment;
  },

  verifyChallenge(code: string): boolean {
    return code.trim() === "123456";
  },
};
