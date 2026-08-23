"use client";

import { Button } from "@/components/ui/button";
import { useSessionMonitor } from "../hooks/useSessionMonitor";

export function SessionWarning() {
  const { warnSoon, minutesLeft, continueSession } = useSessionMonitor();

  if (!warnSoon) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed inset-x-0 bottom-4 z-50 mx-auto flex w-[calc(100%-2rem)] max-w-md items-center justify-between gap-3 rounded-card border border-status-warning bg-status-warning-soft px-4 py-3 shadow-token"
    >
      <p className="text-sm text-ink-900">
        Session expires in ~{minutesLeft} min. Continue your session?
      </p>
      <Button size="sm" onClick={continueSession}>
        Continue
      </Button>
    </div>
  );
}
