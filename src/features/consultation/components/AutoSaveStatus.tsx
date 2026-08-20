import { useEffect, useState } from "react";
import type { SaveStatus } from "../types/consultation.types";

type AutoSaveStatusProps = {
  status: SaveStatus;
  lastSavedAt: Date | null;
};

export function AutoSaveStatus({ status, lastSavedAt }: AutoSaveStatusProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (status === "saving") {
    return (
      <span className="inline-flex items-center gap-2 text-xs text-ink-500">
        <svg
          aria-hidden="true"
          className="h-3.5 w-3.5 animate-spin text-brand-600"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
        Saving draft...
      </span>
    );
  }

  if (status === "saved" && lastSavedAt) {
    const seconds = Math.max(0, Math.round((now - lastSavedAt.getTime()) / 1000));
    const label = seconds <= 1 ? "just now" : `${seconds} seconds ago`;
    return <span className="text-xs text-status-success">Saved {label}</span>;
  }

  return <span className="text-xs text-ink-400">Draft not saved yet</span>;
}