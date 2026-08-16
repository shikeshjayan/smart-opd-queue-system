import Link from "next/link";
import type { Department } from "@/types";

type DepartmentCardProps = {
  department: Department;
};

export function DepartmentCard({ department }: DepartmentCardProps) {
  return (
    <article className="flex items-center justify-between gap-3 rounded-card border border-ink-200 bg-surface p-4 shadow-card">
      <div>
        <h3 className="font-semibold text-ink-900">{department.name}</h3>
        <p className="mt-0.5 text-sm text-ink-500">{department.waitingCount} waiting</p>
      </div>
      <Link
        href={`/patient/opd?hospital=${department.hospitalId}&department=${department.id}`}
        className="flex h-10 shrink-0 items-center rounded-btn border border-brand-600 px-4 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
      >
        Select
      </Link>
    </article>
  );
}
