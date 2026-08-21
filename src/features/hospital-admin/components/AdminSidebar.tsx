"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useHospitalAdmin } from "../hospital-context";

const navGroups: Array<{ label: string; items: Array<{ href: string; label: string }> }> = [
  {
    label: "Operations",
    items: [
      { href: "/hospital-admin/dashboard", label: "Dashboard" },
      { href: "/hospital-admin/departments", label: "Departments" },
      { href: "/hospital-admin/opd", label: "OPD Sessions" },
      { href: "/hospital-admin/schedules", label: "Schedules" },
      { href: "/hospital-admin/queues", label: "Queues" },
      { href: "/hospital-admin/services", label: "Services" },
      { href: "/hospital-admin/appointments", label: "Appointments" },
    ],
  },
  {
    label: "People",
    items: [
      { href: "/hospital-admin/doctors", label: "Doctors" },
      { href: "/hospital-admin/staff", label: "Staff" },
    ],
  },
  {
    label: "Insights",
    items: [
      { href: "/hospital-admin/reports", label: "Reports" },
      { href: "/hospital-admin/audit", label: "Audit Activity" },
    ],
  },
  {
    label: "More",
    items: [
      { href: "/hospital-admin/patients", label: "Patients" },
      { href: "/hospital-admin/queue-overrides", label: "Queue Overrides" },
      { href: "/hospital-admin/notifications", label: "Notifications" },
      { href: "/hospital-admin/settings", label: "Settings" },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { admin } = useHospitalAdmin();

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-ink-200 bg-surface md:flex">
      <Link
        href="/hospital-admin/dashboard"
        className="flex h-16 items-center gap-2 border-b border-ink-200 px-4 font-semibold text-ink-900"
      >
        <span
          className="flex h-8 w-8 items-center justify-center rounded-btn bg-brand-700 text-sm font-bold text-white"
          aria-hidden="true"
        >
          HA
        </span>
        <span>Hospital Admin</span>
      </Link>

      <nav aria-label="Hospital admin navigation" className="flex-1 overflow-y-auto px-2 py-4">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-4">
            <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
              {group.label}
            </p>
            <ul className="flex flex-col">
              {group.items.map((item) => {
                const active =
                  pathname === item.href || (item.href !== "/hospital-admin/dashboard" && pathname.startsWith(`${item.href}/`));
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`block rounded-btn px-3 py-2 text-sm font-medium transition-colors ${
                        active
                          ? "bg-brand-50 text-brand-700"
                          : "text-ink-600 hover:bg-surface-muted hover:text-ink-900"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {admin && (
        <div className="border-t border-ink-200 px-4 py-3 text-xs text-ink-500">
          <p className="font-medium text-ink-700">{admin.name}</p>
          <p>{admin.role}</p>
        </div>
      )}
    </aside>
  );
}
