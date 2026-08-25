"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useUnreadCount } from "../hooks/useNotifications";
import { timeAgo } from "../utils/format";

function BellIcon({ hasUnread }: { hasUnread: boolean }) {
  return (
    <span className="relative" aria-label={hasUnread ? "You have unread notifications" : "Notifications"}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
      {hasUnread && <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">!</span>}
    </span>
  );
}

export function NotificationBell() {
  const { user } = useAuth();
  const patientId = user?.id;
  const { count: unreadCount, refresh } = useUnreadCount();

  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        className="flex items-center gap-2 rounded-btn p-2 text-ink-600 hover:bg-ink-100"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <BellIcon hasUnread={unreadCount > 0} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-card border border-ink-200 bg-surface shadow-lg p-2 z-50">
          <div className="flex items-center justify-between px-2 py-2">
            <h3 className="font-semibold text-ink-900">Notifications</h3>
            {unreadCount > 0 && (
              <Link
                href="/patient/notifications"
                className="text-xs font-medium text-brand-700 hover:underline"
                onClick={() => setOpen(false)}
              >
                View all
              </Link>
            )}
          </div>
          <hr className="border-ink-200" />
          <div className="px-2 py-2 text-sm text-ink-500 text-center">
            {unreadCount > 0
              ? `${unreadCount} unread`
              : "No unread notifications"}
          </div>
          <div className="px-2 py-2">
            <Link
              href="/patient/notifications"
              className="block w-full text-center text-sm font-medium text-brand-700 hover:underline"
              onClick={() => setOpen(false)}
            >
              Open Notification Center
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}