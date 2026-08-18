"use client";

import { getDistrictName } from "@/config/districts";
import { getDepartment, getHospital } from "@/services/data";
import { useAuth } from "../hooks/useAuth";

export function ScopeBreadcrumbs() {
  const { user } = useAuth();
  if (!user) return null;

  const crumbs: string[] = [];
  if (user.scope.stateId === "kerala") crumbs.push("Kerala");
  if (user.scope.districtId) crumbs.push(getDistrictName(user.scope.districtId));
  if (user.scope.hospitalId) {
    const hospital = getHospital(user.scope.hospitalId);
    if (hospital) crumbs.push(hospital.name);
  }
  if (user.scope.departmentId) {
    const department = getDepartment(user.scope.departmentId);
    if (department) crumbs.push(department.name);
  }

  if (crumbs.length <= 1) return null;

  return (
    <nav aria-label="Organisation scope" className="mb-1">
      <ol className="flex flex-wrap items-center gap-1.5 text-xs text-ink-500">
        {crumbs.map((crumb, index) => (
          <li key={crumb} className="flex items-center gap-1.5">
            {index > 0 && (
              <span aria-hidden="true" className="text-ink-300">
                /
              </span>
            )}
            <span className={index === crumbs.length - 1 ? "font-medium text-ink-700" : undefined}>
              {crumb}
            </span>
          </li>
        ))}
      </ol>
    </nav>
  );
}