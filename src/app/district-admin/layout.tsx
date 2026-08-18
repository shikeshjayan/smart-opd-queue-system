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
