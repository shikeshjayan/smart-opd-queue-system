import { describe, it, expect, vi, beforeEach } from "vitest";
import { z } from "zod";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Phase A security: input validation", () => {
  it("validateAction accepts valid input", async () => {
    const { validateAction } = await import("@/lib/validate-action");
    const schema = z.object({ phone: z.string().regex(/^\d{10}$/) });
    const out = validateAction(schema, { phone: "9876543210" });
    expect(out.phone).toBe("9876543210");
  });

  it("validateAction throws ValidationError for invalid input", async () => {
    const { validateAction, ValidationError } = await import("@/lib/validate-action");
    const schema = z.object({ phone: z.string().regex(/^\d{10}$/) });
    expect(() => validateAction(schema, { phone: "abc" })).toThrow(ValidationError);
  });

  it("handleActionError maps ValidationError to ActionResponse", async () => {
    const { handleActionError, ValidationError } = await import("@/lib/validate-action");
    const err = new ValidationError([{ path: ["phone"], message: "Invalid", code: "invalid_string" } as unknown as z.ZodIssue]);
    const res = handleActionError(err);
    expect(res.ok).toBe(false);
    expect(res.error).toContain("Validation failed");
  });

  it("handleActionError maps generic Error", async () => {
    const { handleActionError } = await import("@/lib/validate-action");
    const res = handleActionError(new Error("boom"));
    expect(res).toEqual({ ok: false, error: "boom" });
  });
});

describe("Phase A security: action response type", () => {
  it("actionOk builds success response", async () => {
    const { actionOk } = await import("@/types/action-response");
    expect(actionOk({ id: "x" })).toEqual({ ok: true, data: { id: "x" } });
  });

  it("actionError builds failure response", async () => {
    const { actionError } = await import("@/types/action-response");
    expect(actionError("nope")).toEqual({ ok: false, error: "nope" });
  });
});

describe("Phase A security: queue stream endpoint removed", () => {
  it("src/app/api/queue does not exist", async () => {
    const { existsSync } = await import("node:fs");
    const { join } = await import("node:path");
    const root = process.cwd();
    expect(existsSync(join(root, "src/app/api/queue"))).toBe(false);
  });
});

describe("Phase A security: proxy coverage", () => {
  it("proxy protects /pharmacy, /audit, /diagnostics", async () => {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const root = process.cwd();
    const proxy = readFileSync(join(root, "src/proxy.ts"), "utf-8");
    expect(proxy).toContain('"/pharmacy"');
    expect(proxy).toContain('"/pharmacy/:path*"');
    expect(proxy).toContain('"/audit/:path*"');
    expect(proxy).toContain('"/diagnostics/:path*"');
  });
});

describe("Phase A security: OTP generation", () => {
  it("generateSecureOtp produces 6-digit code via CSPRNG", async () => {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const root = process.cwd();
    const auth = readFileSync(join(root, "src/server/actions/auth.ts"), "utf-8");
    expect(auth).toContain("randomInt");
    expect(auth).not.toContain("Math.random");
    expect(auth).not.toContain("console.log");
  });

  it("auth actions validate input with zod schemas", async () => {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const root = process.cwd();
    const auth = readFileSync(join(root, "src/server/actions/auth.ts"), "utf-8");
    expect(auth).toContain("validateAction");
    expect(auth).toContain("verifyOtpSchema");
    expect(auth).toContain("staffLoginSchema");
  });
});

describe("Phase A security: demo creds removed", () => {
  it("StaffLoginForm no longer reveals demo credentials", async () => {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const root = process.cwd();
    const form = readFileSync(join(root, "src/features/auth/components/StaffLoginForm.tsx"), "utf-8");
    expect(form).not.toContain("doctor123");
    expect(form).not.toContain("doc_001 /");
  });
});