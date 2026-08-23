"use client";

import { useCallback, useEffect, useState } from "react";
import { authService } from "@/services/auth";

const POLL_INTERVAL_MS = 30_000;
const WARN_THRESHOLD_MS = 15 * 60_000;

export function useSessionMonitor() {
  const [msRemaining, setMsRemaining] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => {
      const session = authService.restore();
      if (!session.session) {
        setMsRemaining(null);
        return;
      }
      const remaining = new Date(session.session.expiresAt).getTime() - Date.now();
      setMsRemaining(Math.max(0, remaining));
    };
    tick();
    const interval = setInterval(tick, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  const continueSession = useCallback(() => {
    authService.extendSession();
    setMsRemaining(8 * 60 * 60 * 1000);
  }, []);

  return {
    warnSoon: msRemaining !== null && msRemaining > 0 && msRemaining <= WARN_THRESHOLD_MS,
    minutesLeft: msRemaining === null ? null : Math.max(1, Math.ceil(msRemaining / 60_000)),
    continueSession,
  };
}
