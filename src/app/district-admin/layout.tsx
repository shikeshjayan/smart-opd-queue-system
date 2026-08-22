import type { ReactNode } from "react";
import { RoleGuard } from "@/features/auth/components/RoleGuard";
import { GovernmentShell } from "@/features/government-admin/components/GovernmentShell";
import type { GovernmentNavItem } from "@/features/government-admin/components/GovernmentSidebar";

const navItems: GovernmentNavItem[] = [
  { href: "/district-admin/dashboard", label: "Dashboard" },
  { href: "/district-admin/hospitals", label: "Hospitals" },
  { href: "/district-admin/queues", label: "Queues" },
  { href: "/district-admin/opd", label: "OPD Activity" },
  { href: "/district-admin/reports", label: "Reports" },
  { href: "/district-admin/alerts", label: "Alerts" },
  { href: "/district-admin/departments", label: "Departments" },
  { href: "/district-admin/services", label: "Services" },
  { href: "/district-admin/capacity", label: "Capacity" },
  { href: "/district-admin/staff", label: "Staff" },
  { href: "/district-admin/referrals", label: "Referrals" },
  { href: "/district-admin/announcements", label: "Announcements" },
  { href: "/district-admin/audit", label: "Audit" },
  { href: "/district-admin/settings", label: "Settings" },
];

export default function DistrictAdminLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard roles={["district_admin"]}>
      <GovernmentShell
        scope="district"
        brand={{ short: "DA", title: "District Admin" }}
        navItems={navItems}
        homeHref="/district-admin/dashboard"
      >
        {children}
      </GovernmentShell>
    </RoleGuard>
  );
}
