import type { ReactNode } from "react";
import { RoleGuard } from "@/features/auth/components/RoleGuard";
import { GovernmentShell } from "@/features/government-admin/components/GovernmentShell";
import type { GovernmentNavItem } from "@/features/government-admin/components/GovernmentSidebar";

const navItems: GovernmentNavItem[] = [
  { href: "/state-admin/dashboard", label: "Dashboard" },
  { href: "/state-admin/districts", label: "Districts" },
  { href: "/state-admin/hospitals", label: "Hospitals" },
  { href: "/state-admin/services", label: "Services" },
  { href: "/state-admin/capacity", label: "Capacity" },
  { href: "/state-admin/analytics", label: "Analytics" },
  { href: "/state-admin/alerts", label: "Alerts" },
  { href: "/state-admin/announcements", label: "Announcements" },
  { href: "/state-admin/users", label: "Users" },
  { href: "/state-admin/audit", label: "Audit" },
  { href: "/state-admin/system-health", label: "System Health" },
  { href: "/state-admin/integrations", label: "Integrations" },
  { href: "/state-admin/reports", label: "Reports" },
  { href: "/state-admin/settings", label: "Settings" },
];

export default function StateAdminLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard roles={["state_admin"]}>
      <GovernmentShell
        scope="state"
        brand={{ short: "SA", title: "State Admin" }}
        navItems={navItems}
        homeHref="/state-admin/dashboard"
      >
        {children}
      </GovernmentShell>
    </RoleGuard>
  );
}
