"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/features/auth/components/LogoutButton";
import { SessionBadge } from "@/features/auth/components/SessionBadge";

const navItems = [
  { href: "/clinical/priority", label: "Priority Assessment" },
  { href: "/clinical/assistance", label: "Assistance" },
  { href: "/clinical/history", label: "Activity" },
];

export function ClinicalHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-ink-200 bg-surface">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4">
        <Link href="/clinical/priority" className="flex items-center gap-2 font-semibold text-ink-900">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-btn bg-brand-600 text-sm font-bold text-white"
            aria-hidden="true"
          >
            CS
          </span>
          <span className="hidden sm:inline">Clinical Desk</span>
        </Link>

        <nav aria-label="Clinical navigation" className="flex items-center gap-1 overflow-x-auto">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
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

        <div className="hidden shrink-0 items-center gap-2 lg:flex">
          <SessionBadge />
        </div>
        <LogoutButton compact />
      </div>
    </header>
  );
}
