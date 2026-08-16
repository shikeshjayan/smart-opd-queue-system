import type { ReactNode } from "react";
import { GovernmentShell } from "@/features/government-admin/components/GovernmentShell";
import type { GovernmentNavItem } from "@/features/government-admin/components/GovernmentSidebar";

const navItems: GovernmentNavItem[] = [
  { href: "/state-admin/dashboard", label: "Dashboard" },
  { href: "/state-admin/districts", label: "Districts" },
  { href: "/state-admin/hospitals", label: "Hospitals" },
  { href: "/state-admin/queues", label: "Queues" },
  { href: "/state-admin/reports", label: "Reports" },
  { href: "/state-admin/alerts", label: "Alerts" },
];

export default function StateAdminLayout({ children }: { children: ReactNode }) {
  return (
    <GovernmentShell
      scope="state"
      brand={{ short: "SA", title: "State Admin" }}
      navItems={navItems}
      homeHref="/state-admin/dashboard"
    >
      {children}
    </GovernmentShell>
  );
}
