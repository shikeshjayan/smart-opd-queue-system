"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/features/auth/components/LogoutButton";
import { SessionBadge } from "@/features/auth/components/SessionBadge";
import { useHospitalAdmin } from "../hospital-context";
import { HospitalSwitcher } from "./HospitalSwitcher";

const mobileNavItems = [
  { href: "/hospital-admin/dashboard", label: "Dashboard" },
  { href: "/hospital-admin/departments", label: "Departments" },
  { href: "/hospital-admin/opd-sessions", label: "Sessions" },
  { href: "/hospital-admin/opd", label: "OPDs" },
  { href: "/hospital-admin/rooms", label: "Rooms" },
  { href: "/hospital-admin/doctors", label: "Doctors" },
  { href: "/hospital-admin/staff", label: "Staff" },
  { href: "/hospital-admin/staff/leave", label: "Leave" },
  { href: "/hospital-admin/queues", label: "Queues" },
  { href: "/hospital-admin/patients", label: "Patients" },
  { href: "/hospital-admin/reports", label: "Reports" },
  { href: "/hospital-admin/notifications", label: "Notifications" },
  { href: "/hospital-admin/settings", label: "Settings" },
];

export function AdminHeader() {
  const pathname = usePathname();
  const { hospital } = useHospitalAdmin();

  return (
    <header className="sticky top-0 z-40 border-b border-ink-200 bg-surface">
      <div className="flex h-16 items-center justify-between gap-4 px-4">
        <Link
          href="/hospital-admin/dashboard"
          className="flex items-center gap-2 font-semibold text-ink-900 md:hidden"
        >
          <span
            className="flex h-8 w-8 items-center justify-center rounded-btn bg-brand-700 text-sm font-bold text-white"
            aria-hidden="true"
          >
            HA
          </span>
          <span>Hospital Admin</span>
        </Link>

        <div className="hidden items-center gap-2 md:flex">
          <p className="text-sm font-medium text-ink-900">
            {hospital ? hospital.name : "Loading hospital..."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 lg:flex">
            <SessionBadge />
          </div>
          <LogoutButton compact />
          <HospitalSwitcher />
        </div>
      </div>

      <nav
        aria-label="Hospital admin navigation"
        className="flex items-center gap-1 overflow-x-auto border-t border-ink-100 px-4 py-2 md:hidden"
      >
        {mobileNavItems.map((item) => {
          const isActive =
            item.href === "/hospital-admin/dashboard"
              ? pathname === item.href
              : pathname.startsWith(item.href);
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
