"use client";

import { useCallback, useEffect, useState } from "react";
import { restoreSession } from "@/server/actions/auth";

const POLL_INTERVAL_MS = 30_000;
const WARN_THRESHOLD_MS = 15 * 60_000;

export function useSessionMonitor() {
  const [msRemaining, setMsRemaining] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    const tick = async () => {
      try {
        const result = await restoreSession();
        if (!active) return;
        if (!result.session) {
          setMsRemaining(null);
          return;
        }
        const remaining = new Date(result.session.expiresAt).getTime() - Date.now();
        setMsRemaining(Math.max(0, remaining));
      } catch {
        if (active) setMsRemaining(null);
      }
    };
    tick();
    const interval = setInterval(tick, POLL_INTERVAL_MS);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const continueSession = useCallback(async () => {
    await restoreSession();
    setMsRemaining(8 * 60 * 60 * 1000);
  }, []);

  return {
    warnSoon: msRemaining !== null && msRemaining > 0 && msRemaining <= WARN_THRESHOLD_MS,
    minutesLeft: msRemaining === null ? null : Math.max(1, Math.ceil(msRemaining / 60_000)),
    continueSession,
  };
}
