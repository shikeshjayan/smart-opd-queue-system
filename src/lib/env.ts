import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_API_BASE_URL: z.string().optional(),
  MONGODB_URI: z.string().startsWith("mongodb").optional(),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters").optional(),
  CRON_SECRET: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

export const env = {
  NODE_ENV: (process.env.NODE_ENV as "development" | "production" | "test" | undefined) ?? "development",
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  CRON_SECRET: process.env.CRON_SECRET,
};

export function validateEnv(): void {
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `- ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    console.error(`[env] Invalid environment variables:\n${issues}`);
    throw new Error("Invalid environment variables — fix .env and restart");
  }

  const required: Array<{ key: string; value?: string; hint?: string }> = [
    { key: "MONGODB_URI", value: env.MONGODB_URI },
    { key: "JWT_SECRET", value: env.JWT_SECRET, hint: "min 32 characters" },
  ];
  for (const r of required) {
    if (!r.value) {
      throw new Error(`[env] Missing required variable ${r.key}${r.hint ? ` (${r.hint})` : ""} in .env`);
    }
  }
}

export function hasEnv(name: keyof typeof env): boolean {
  return Boolean(env[name]);
}