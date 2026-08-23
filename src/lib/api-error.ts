export type ApiErrorCode =
  | "UNAUTHENTICATED"
  | "ACCESS_DENIED"
  | "NOT_FOUND"
  | "VALIDATION_FAILED"
  | "CONSENT_REQUIRED"
  | "CONFLICT"
  | "INTERNAL";

const HTTP_STATUS: Record<ApiErrorCode, number> = {
  UNAUTHENTICATED: 401,
  ACCESS_DENIED: 403,
  NOT_FOUND: 404,
  VALIDATION_FAILED: 422,
  CONSENT_REQUIRED: 403,
  CONFLICT: 409,
  INTERNAL: 500,
};

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;

  constructor(code: ApiErrorCode, message: string) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = HTTP_STATUS[code];
  }

  toPayload(): { code: ApiErrorCode; message: string } {
    return { code: this.code, message: this.message };
  }
}

export function notFound(message = "The requested resource was not found."): ApiError {
  return new ApiError("NOT_FOUND", message);
}

export function accessDenied(message = "You don't have permission to perform this action."): ApiError {
  return new ApiError("ACCESS_DENIED", message);
}

export function unauthenticated(message = "Please sign in to continue."): ApiError {
  return new ApiError("UNAUTHENTICATED", message);
}

export function consentRequired(message = "Patient consent is required for this action."): ApiError {
  return new ApiError("CONSENT_REQUIRED", message);
}

export function toPublicError(error: unknown): { code: ApiErrorCode; message: string } {
  if (error instanceof ApiError) return error.toPayload();
  return {
    code: "INTERNAL",
    message: "Something went wrong. Please try again.",
  };
}
