"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/features/auth/components/LogoutButton";
import { SessionBadge } from "@/features/auth/components/SessionBadge";

const navItems = [
  { href: "/lab/dashboard", label: "Dashboard" },
  { href: "/lab/orders", label: "Orders" },
  { href: "/lab/results", label: "Results" },
];

export function LabHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-ink-200 bg-surface">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4">
        <Link href="/lab/dashboard" className="flex items-center gap-2 font-semibold text-ink-900">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-btn bg-brand-700 text-sm font-bold text-white"
            aria-hidden="true"
          >
            LB
          </span>
          <span className="hidden sm:inline">Laboratory Workspace</span>
        </Link>

        <nav aria-label="Laboratory navigation" className="flex items-center gap-1 overflow-x-auto">
          {navItems.map((item) => {
            const isActive =
              item.href === "/lab/dashboard"
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

        <div className="hidden shrink-0 items-center gap-2 lg:flex">
          <SessionBadge />
        </div>
        <LogoutButton compact />
      </div>
    </header>
  );
}