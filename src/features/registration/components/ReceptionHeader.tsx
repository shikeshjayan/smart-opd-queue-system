"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/features/auth/components/LogoutButton";
import { SessionBadge } from "@/features/auth/components/SessionBadge";
import { useReception } from "../reception-context";

const navItems = [
  { href: "/reception/dashboard", label: "Dashboard" },
  { href: "/reception/registration", label: "Registration" },
  { href: "/reception/appointments", label: "Appointments" },
  { href: "/reception/patients", label: "Patients" },
  { href: "/reception/tokens", label: "Tokens" },
  { href: "/reception/queue", label: "Live Queue" },
  { href: "/reception/history", label: "History" },
];

export function ReceptionHeader() {
  const pathname = usePathname();
  const { counter, receptionistName, active } = useReception();

  return (
    <header className="sticky top-0 z-40 border-b border-ink-200 bg-surface">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/reception/dashboard" className="flex items-center gap-2 font-semibold text-ink-900">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-btn bg-brand-600 text-sm font-bold text-white"
            aria-hidden="true"
          >
            RC
          </span>
          <span className="hidden sm:inline">Reception Desk</span>
        </Link>

        <nav aria-label="Reception navigation" className="flex items-center gap-1 overflow-x-auto">
          {navItems.map((item) => {
            const isActive =
              item.href === "/reception/dashboard"
                ? pathname === item.href
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`whitespace-nowrap rounded-btn px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-brand-600 ${
                  isActive ? "bg-brand-100 text-brand-700" : "text-ink-500 hover:bg-ink-100 hover:text-ink-900"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <span className="hidden items-center gap-1.5 rounded-full border border-ink-200 px-3 py-1.5 text-xs text-ink-700 md:flex">
            <span
              className={`h-2 w-2 rounded-full ${active ? "bg-status-success" : "bg-ink-300"}`}
              aria-hidden="true"
            />
            Counter {counter} &middot; {receptionistName}
          </span>
          <SessionBadge />
        </div>
        <LogoutButton compact />
      </div>
    </header>
  );
}