"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/features/auth/components/LogoutButton";
import { SessionBadge } from "@/features/auth/components/SessionBadge";
import type { GovernmentNavItem } from "./GovernmentSidebar";

type GovernmentHeaderProps = {
  brand: { short: string; title: string };
  navItems: GovernmentNavItem[];
  homeHref: string;
  scopeLabel: string;
};

export function GovernmentHeader({ brand, navItems, homeHref, scopeLabel }: GovernmentHeaderProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-ink-200 bg-surface">
      <div className="flex h-16 items-center justify-between gap-4 px-4">
        <Link href={homeHref} className="flex items-center gap-2 font-semibold text-ink-900 md:hidden">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-btn bg-brand-700 text-sm font-bold text-white"
            aria-hidden="true"
          >
            {brand.short}
          </span>
          <span>{brand.title}</span>
        </Link>

        <div className="hidden items-center gap-2 md:flex">
          <p className="text-sm font-medium text-ink-900">{scopeLabel}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 lg:flex">
            <SessionBadge />
          </div>
          <LogoutButton compact />
          <span className="inline-flex items-center gap-1.5 rounded-full border border-status-success-soft bg-status-success-soft px-2.5 py-0.5 text-xs font-medium text-status-success">
            <span className="h-1.5 w-1.5 rounded-full bg-status-success" aria-hidden="true" />
            Live
          </span>
        </div>
      </div>

      <nav
        aria-label={`${brand.title} navigation`}
        className="flex items-center gap-1 overflow-x-auto border-t border-ink-100 px-4 py-2 md:hidden"
      >
        {navItems.map((item) => {
          const isActive =
            item.href === homeHref ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`whitespace-nowrap rounded-btn px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-brand-600 ${
                isActive ? "bg-brand-100 text-brand-700" : "text-ink-500 hover:bg-ink-100"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
