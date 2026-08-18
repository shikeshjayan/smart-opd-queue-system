"use client";

import { useAuth } from "../hooks/useAuth";
import { roleLabel } from "../roles";

export function SessionBadge() {
  const { status, user } = useAuth();
  if (status !== "authenticated" || !user) return null;

  return (
    <div className="flex items-center gap-2 rounded-full border border-ink-200 bg-surface px-3 py-1.5">
      <span className="h-2 w-2 shrink-0 rounded-full bg-status-success" aria-hidden="true" />
      <span className="max-w-[9rem] truncate text-sm font-medium text-ink-900">{user.name}</span>
      <span className="text-xs text-ink-500">{roleLabel(user.role)}</span>
    </div>
  );
}