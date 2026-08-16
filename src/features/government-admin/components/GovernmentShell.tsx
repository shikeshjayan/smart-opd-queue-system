"use client";

import type { ReactNode } from "react";
import { DistrictAdminProvider, useDistrictAdmin } from "../district-context";
import { StateAdminProvider, useStateAdmin } from "../state-context";
import { GovernmentSidebar, type GovernmentNavItem } from "./GovernmentSidebar";
import { GovernmentHeader } from "./GovernmentHeader";

type GovernmentShellProps = {
  scope: "district" | "state";
  brand: { short: string; title: string };
  navItems: GovernmentNavItem[];
  homeHref: string;
  children: ReactNode;
};

function GovernmentShellBody({
  brand,
  navItems,
  homeHref,
  scopeLabel,
  footerName,
  footerRole,
  children,
}: {
  brand: { short: string; title: string };
  navItems: GovernmentNavItem[];
  homeHref: string;
  scopeLabel: string;
  footerName: string;
  footerRole: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <GovernmentSidebar
        brand={brand}
        navItems={navItems}
        homeHref={homeHref}
        footerName={footerName}
        footerRole={footerRole}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <GovernmentHeader
          brand={brand}
          navItems={navItems}
          homeHref={homeHref}
          scopeLabel={scopeLabel}
        />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
      </div>
    </div>
  );
}

export function GovernmentShell({ scope, brand, navItems, homeHref, children }: GovernmentShellProps) {
  if (scope === "district") {
    return (
      <DistrictAdminProvider>
        <DistrictShellContent
          brand={brand}
          navItems={navItems}
          homeHref={homeHref}
        >
          {children}
        </DistrictShellContent>
      </DistrictAdminProvider>
    );
  }
  return (
    <StateAdminProvider>
      <StateShellContent brand={brand} navItems={navItems} homeHref={homeHref}>
        {children}
      </StateShellContent>
    </StateAdminProvider>
  );
}

function DistrictShellContent({
  brand,
  navItems,
  homeHref,
  children,
}: {
  brand: { short: string; title: string };
  navItems: GovernmentNavItem[];
  homeHref: string;
  children: ReactNode;
}) {
  const { admin, districtName } = useDistrictAdmin();
  return (
    <GovernmentShellBody
      brand={brand}
      navItems={navItems}
      homeHref={homeHref}
      scopeLabel={districtName ? `${districtName} District` : "Loading district..."}
      footerName={admin?.name ?? "District Admin"}
      footerRole={admin ? "District Administrator" : "Loading..."}
    >
      {children}
    </GovernmentShellBody>
  );
}

function StateShellContent({
  brand,
  navItems,
  homeHref,
  children,
}: {
  brand: { short: string; title: string };
  navItems: GovernmentNavItem[];
  homeHref: string;
  children: ReactNode;
}) {
  const { admin } = useStateAdmin();
  return (
    <GovernmentShellBody
      brand={brand}
      navItems={navItems}
      homeHref={homeHref}
      scopeLabel="Kerala Government Health Network"
      footerName={admin?.name ?? "State Admin"}
      footerRole={admin ? "State Administrator" : "Loading..."}
    >
      {children}
    </GovernmentShellBody>
  );
}
