"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { realtimeClient } from "../client";
import type { ConnectionStatus, RealtimeEvent, RealtimeListener } from "../types/realtime.types";

export function useRealtime() {
  const [status, setStatus] = useState<ConnectionStatus>(realtimeClient.status);
  const subscriptions = useRef<Array<() => void>>([]);

  useEffect(() => {
    realtimeClient.connect();
    const unsubscribeStatus = realtimeClient.onStatusChange(() =>
      setStatus(realtimeClient.status)
    );
    return unsubscribeStatus;
  }, []);

  useEffect(
    () => () => {
      subscriptions.current.forEach((unsubscribe) => unsubscribe());
      subscriptions.current = [];
    },
    []
  );

  const subscribe = useCallback((type: RealtimeEvent["type"] | "*", listener: RealtimeListener) => {
    const unsubscribe = realtimeClient.subscribe(type, listener);
    subscriptions.current.push(unsubscribe);
    return unsubscribe;
  }, []);

  const simulateDisconnect = useCallback(() => {
    realtimeClient.simulateDisconnect();
  }, []);

  return {
    status,
    subscribe,
    simulateDisconnect,
  };
}
