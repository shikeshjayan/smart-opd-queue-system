"use server";

import "server-only";
import { cookies } from "next/headers";
import type { UserRole } from "@/features/auth/types/auth.types";
import type { SessionUser } from "@/features/auth/types/auth.types";
import { dbConnect } from "@/lib/db";
import { UserModel, OtpModel } from "@/lib/models";
import { setSessionCookie, clearSessionCookie, getSession } from "@/lib/auth";
import { AUTH_COOKIE } from "@/config/app";

type SessionResult = {
  session: { user: SessionUser; issuedAt: string; expiresAt: string } | null;
  reason?: "missing" | "expired";
};

export async function requestPatientOtp(
  phone: string
): Promise<{ pending: boolean; identifier: string; name?: string }> {
  await dbConnect();
  const user = await UserModel.findOne({ phone, role: "patient" }).lean();
  if (!user) return { pending: true, identifier: phone };

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  await OtpModel.deleteMany({ phone });
  await OtpModel.create({ phone, code, expiresAt, attempts: 0 });

  if (process.env.NODE_ENV !== "production") {
    console.log(`[OTP] ${phone}: ${code}`);
  }

  return { pending: true, identifier: phone, name: user.name };
}

export async function verifyPatientOtp(
  phone: string,
  otp: string
): Promise<SessionUser | null> {
  await dbConnect();
  const record = await OtpModel.findOne({ phone }).sort({ expiresAt: -1 }).lean<{
    code: string;
    expiresAt: Date;
    attempts: number;
  }>();
  if (!record) return null;
  if (new Date(record.expiresAt).getTime() < Date.now()) return null;
  if (record.attempts >= 5) return null;
  if (record.code !== otp.trim()) {
    await OtpModel.updateOne({ phone }, { $inc: { attempts: 1 } });
    return null;
  }

  await OtpModel.deleteMany({ phone });

  const user = await UserModel.findOne({ phone, role: "patient" }).lean<{
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
  await dbConnect();
  const user = await UserModel.findOne({
    _id: staffId,
    role: { $ne: "patient" },
    status: "active",
  }).lean<{
    _id: string;
    name: string;
    role: string;
    scope: Record<string, string | undefined>;
    passwordHash?: string;
    salt?: string;
  }>();
  if (!user || !user.passwordHash || !user.salt) return null;

  const { scryptSync } = await import("node:crypto");
  const candidateHash = scryptSync(password, user.salt, 64).toString("hex");
  if (candidateHash !== user.passwordHash) return null;

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
