"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useAsync } from "@/lib/use-async";
import { tokenService } from "@/services/token";
import { useNotifications, type ActiveToken } from "../hooks/useNotifications";
import { timeAgo } from "../utils/format";

function BellIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

export function NotificationBell() {
  const { user } = useAuth();
  const patientId = user?.id;
  const activeToken = useAsync(() => patientId ? tokenService.getActive(patientId) : Promise.resolve(null), [patientId]);
  const active: ActiveToken | null = activeToken.data
    ? {
        tokenId: activeToken.data.token.id,
        tokenNumber: activeToken.data.token.tokenNumber,
        opdId: activeToken.data.token.opdId,
      }
    : null;
  const { unreadCount, notifications, markAllRead, isLoading } = useNotifications(
    patientId ?? "",
    active
  );

  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    if (unreadCount > 0) void markAllRead();
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const recent = (notifications ?? []).slice(0, 5);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={open}
        className="relative flex h-9 w-9 items-center justify-center rounded-btn border border-ink-200 text-ink-700 transition-colors hover:bg-ink-100 focus-visible:outline-2 focus-visible:outline-brand-600"
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-status-danger px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-card border border-ink-200 bg-surface shadow-card">
          <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
            <p className="text-sm font-semibold text-ink-900">Notifications</p>
            <Link
              href="/patient/notifications"
              onClick={() => setOpen(false)}
              className="text-xs font-medium text-brand-700 hover:underline"
            >
              View all
            </Link>
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <li className="px-4 py-3 text-sm text-ink-500">Loading…</li>
            ) : recent.length === 0 ? (
              <li className="px-4 py-3 text-sm text-ink-500">No notifications.</li>
            ) : (
              recent.map((notification) => (
                <li
                  key={notification.id}
                  className="border-b border-ink-100 px-4 py-3 last:border-b-0"
                >
                  <p className="text-sm font-medium text-ink-900">{notification.title}</p>
                  <p className="mt-0.5 truncate text-xs text-ink-500">{notification.message}</p>
                  <p className="mt-0.5 text-[11px] text-ink-400">{timeAgo(notification.createdAt)}</p>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
