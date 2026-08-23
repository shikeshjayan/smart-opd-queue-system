import type { SessionUser } from "@/features/auth/types/auth.types";
import { SESSION_STORAGE_KEY } from "@/features/auth/types/auth.types";

export function getCurrentActor(): SessionUser | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as { user?: SessionUser };
    return parsed.user;
  } catch {
    return undefined;
  }
}
