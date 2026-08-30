"use server";

import "server-only";
import { cookies } from "next/headers";
import { randomInt } from "node:crypto";
import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { validateAction } from "@/lib/validate-action";
import type { UserRole } from "@/features/auth/types/auth.types";
import type { SessionUser } from "@/features/auth/types/auth.types";
import { dbConnect } from "@/lib/db";
import { UserModel, OtpModel } from "@/lib/models";
import { setSessionCookie, clearSessionCookie, getSession } from "@/lib/auth";
import { AUTH_COOKIE } from "@/config/app";

const OTP_LENGTH = 6;
const OTP_EXPIRY_MS = 5 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;
const OTP_COOLDOWN_MS = 30 * 1000;
const STAFF_LOGIN_COOLDOWN_MS = 5 * 1000;
const MAX_STAFF_ATTEMPTS = 5;

type SessionResult = {
  session: { user: SessionUser; issuedAt: string; expiresAt: string } | null;
  reason?: "missing" | "expired";
};

const phoneSchema = z.string().regex(/^\+?\d{10,15}$/, "Invalid phone number");
const requestOtpSchema = z.object({ phone: phoneSchema });
const verifyOtpSchema = z.object({
  phone: phoneSchema,
  otp: z.string().regex(/^\d{6}$/, "OTP must be 6 digits"),
});
const staffLoginSchema = z.object({
  staffId: z.string().min(1, "Staff ID required"),
  password: z.string().min(1, "Password required"),
});

function generateSecureOtp(): string {
  let otp = "";
  for (let i = 0; i < OTP_LENGTH; i++) {
    otp += randomInt(0, 10).toString();
  }
  return otp;
}

function timingSafeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export async function requestPatientOtp(
  phone: string
): Promise<{ pending: boolean; identifier: string; name?: string; cooldownUntil?: string }> {
  const input = validateAction(requestOtpSchema, { phone });
  await dbConnect();
  const user = await UserModel.findOne({ phone: input.phone, role: "patient" }).lean();
  if (!user) return { pending: true, identifier: input.phone };

  const existing = await OtpModel.findOne({ phone: input.phone }).sort({ createdAt: -1 }).lean<{
    createdAt: Date;
    attempts: number;
  }>();

  if (existing) {
    const elapsed = Date.now() - new Date(existing.createdAt).getTime();
    if (elapsed < OTP_COOLDOWN_MS && existing.attempts > 0) {
      const cooldownUntil = new Date(new Date(existing.createdAt).getTime() + OTP_COOLDOWN_MS);
      return {
        pending: true,
        identifier: input.phone,
        name: user.name,
        cooldownUntil: cooldownUntil.toISOString(),
      };
    }
  }

  const code = generateSecureOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);
  await OtpModel.deleteMany({ phone: input.phone });
  await OtpModel.create({ phone: input.phone, code, expiresAt, attempts: 0, createdAt: new Date() });

  return { pending: true, identifier: input.phone, name: user.name };
}

export async function verifyPatientOtp(
  phone: string,
  otp: string
): Promise<SessionUser | null> {
  const input = validateAction(verifyOtpSchema, { phone, otp });
  await dbConnect();
  const record = await OtpModel.findOne({ phone: input.phone }).sort({ expiresAt: -1 }).lean<{
    code: string;
    expiresAt: Date;
    attempts: number;
    createdAt: Date;
  }>();
  if (!record) return null;
  if (new Date(record.expiresAt).getTime() < Date.now()) return null;
  if (record.attempts >= MAX_OTP_ATTEMPTS) return null;

  const elapsed = Date.now() - new Date(record.createdAt).getTime();
  if (elapsed < OTP_COOLDOWN_MS && record.attempts > 0) return null;

  if (!timingSafeCompare(record.code, input.otp.trim())) {
    await OtpModel.updateOne({ phone: input.phone }, { $inc: { attempts: 1 } });
    return null;
  }

  await OtpModel.deleteMany({ phone: input.phone });

  const user = await UserModel.findOne({ phone: input.phone, role: "patient" }).lean<{
    _id: string;
    name: string;
    role: string;
    scope: Record<string, string | undefined>;
  }>();
  if (!user) return null;

  const sessionUser: SessionUser = {
    id: user._id,
    name: user.name,
    role: user.role as UserRole,
    scope: user.scope ?? {},
  };
  await setSessionCookie(sessionUser);
  return sessionUser;
}

export async function staffLogin(
  staffId: string,
  password: string
): Promise<SessionUser | null> {
  const input = validateAction(staffLoginSchema, { staffId, password });
  await dbConnect();
  const user = await UserModel.findOne({
    _id: input.staffId,
    role: { $ne: "patient" },
    status: "active",
  }).lean<{
    _id: string;
    name: string;
    role: string;
    scope: Record<string, string | undefined>;
    passwordHash?: string;
    salt?: string;
    loginAttempts?: number;
    loginCooldownUntil?: Date;
  }>();
  if (!user || !user.passwordHash || !user.salt) return null;

  if (user.loginCooldownUntil && new Date(user.loginCooldownUntil).getTime() > Date.now()) {
    return null;
  }

  if ((user.loginAttempts ?? 0) >= MAX_STAFF_ATTEMPTS) {
    await UserModel.updateOne(
      { _id: input.staffId },
      { $set: { loginCooldownUntil: new Date(Date.now() + STAFF_LOGIN_COOLDOWN_MS) } }
    );
    return null;
  }

  const { scryptSync } = await import("node:crypto");
  const candidateHash = scryptSync(input.password, user.salt, 64).toString("hex");

  if (!timingSafeCompare(candidateHash, user.passwordHash)) {
    const newAttempts = (user.loginAttempts ?? 0) + 1;
    const update: Record<string, unknown> = { loginAttempts: newAttempts };
    if (newAttempts >= MAX_STAFF_ATTEMPTS) {
      update.loginCooldownUntil = new Date(Date.now() + STAFF_LOGIN_COOLDOWN_MS);
    }
    await UserModel.updateOne({ _id: input.staffId }, { $set: update });
    return null;
  }

  await UserModel.updateOne({ _id: input.staffId }, { $set: { loginAttempts: 0, loginCooldownUntil: null } });

  const sessionUser: SessionUser = {
    id: user._id,
    name: user.name,
    role: user.role as UserRole,
    scope: user.scope ?? {},
  };
  await setSessionCookie(sessionUser);
  return sessionUser;
}

export async function restoreSession(): Promise<SessionResult> {
  const user = await getSession();
  if (!user) {
    const store = await cookies();
    const hasCookie = !!store.get(AUTH_COOKIE)?.value;
    return { session: null, reason: hasCookie ? "expired" : "missing" };
  }
  const store = await cookies();
  const token = store.get(AUTH_COOKIE)?.value ?? "";
  const { jwtVerify } = await import("jose");
  const { getSessionSecret } = await import("@/lib/auth");
  try {
    const { payload } = await jwtVerify(token, getSessionSecret());
    const iat = typeof payload.iat === "number" ? payload.iat : Math.floor(Date.now() / 1000);
    return {
      session: {
        user,
        issuedAt: new Date(iat * 1000).toISOString(),
        expiresAt: new Date((payload.exp ?? iat + 28800) * 1000).toISOString(),
      },
    };
  } catch {
    return { session: null, reason: "expired" };
  }
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
}
