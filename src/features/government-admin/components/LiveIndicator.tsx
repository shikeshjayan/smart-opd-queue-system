"use client";

import { useEffect, useState } from "react";

export function LiveIndicator() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const label = now.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  return (
    <p className="inline-flex items-center gap-1.5 text-xs text-ink-500">
      <span className="relative flex h-2 w-2" aria-hidden="true">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status-success opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-status-success" />
      </span>
      Live &middot; Last updated: {label}
    </p>
  );
}
