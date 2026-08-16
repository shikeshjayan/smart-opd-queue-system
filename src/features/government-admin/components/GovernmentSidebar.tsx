"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type GovernmentNavItem = {
  href: string;
  label: string;
};

type GovernmentSidebarProps = {
  brand: { short: string; title: string };
  navItems: GovernmentNavItem[];
  homeHref: string;
  footerName?: string;
  footerRole?: string;
};

export function GovernmentSidebar({
  brand,
  navItems,
  homeHref,
  footerName,
  footerRole,
}: GovernmentSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-ink-200 bg-surface md:flex">
      <Link
        href={homeHref}
        className="flex h-16 items-center gap-2 border-b border-ink-200 px-4 font-semibold text-ink-900"
      >
        <span
          className="flex h-8 w-8 items-center justify-center rounded-btn bg-brand-700 text-sm font-bold text-white"
          aria-hidden="true"
        >
          {brand.short}
        </span>
        <span>{brand.title}</span>
      </Link>

      <nav aria-label={`${brand.title} navigation`} className="flex-1 overflow-y-auto px-2 py-4">
        <ul className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive =
              item.href === homeHref ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`block rounded-btn px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-brand-600 ${
                    isActive
                      ? "bg-brand-100 text-brand-700"
                      : "text-ink-500 hover:bg-ink-100 hover:text-ink-900"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {footerName && (
        <div className="border-t border-ink-200 px-4 py-4">
          <p className="truncate text-sm font-medium text-ink-900">{footerName}</p>
          {footerRole && <p className="truncate text-xs text-ink-500">{footerRole}</p>}
        </div>
      )}
    </aside>
  );
}
