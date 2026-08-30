import { z } from "zod";
import type { ActionResponse } from "@/types/action-response";

export class ValidationError extends Error {
  constructor(public readonly issues: z.ZodIssue[]) {
    super(issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "));
    this.name = "ValidationError";
  }
}

export function validateAction<TSchema extends z.ZodType>(
  schema: TSchema,
  input: unknown
): z.infer<TSchema> {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new ValidationError(result.error.issues);
  }
  return result.data;
}

export function handleActionError(e: unknown): ActionResponse<never> {
  if (e instanceof ValidationError) {
    return { ok: false, error: `Validation failed: ${e.message}` };
  }
  if (e instanceof Error) {
    return { ok: false, error: e.message };
  }
  return { ok: false, error: "An unexpected error occurred" };
}
