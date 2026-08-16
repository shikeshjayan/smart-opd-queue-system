import Link from "next/link";
import type { DistrictPerformance } from "@/types";

type DistrictCardProps = {
  district: DistrictPerformance;
  href?: string;
  onSelect?: () => void;
};

export function DistrictCard({ district, href, onSelect }: DistrictCardProps) {
  const inner = (
    <div className="rounded-card border border-ink-200 bg-surface p-4 shadow-card transition-colors hover:border-brand-300">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-ink-900">{district.districtName}</h3>
        <span className="rounded-full bg-ink-100 px-2 py-0.5 text-xs font-medium text-ink-600">
          {district.hospitals} hospitals
        </span>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <dt className="text-xs text-ink-500">Patients</dt>
          <dd className="text-lg font-bold text-ink-900">
            {district.patientsToday.toLocaleString("en-IN")}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-ink-500">Waiting</dt>
          <dd className="text-lg font-bold text-ink-900">
            {district.waiting.toLocaleString("en-IN")}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-ink-500">Completed</dt>
          <dd className="text-lg font-bold text-ink-900">
            {district.completed.toLocaleString("en-IN")}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-ink-500">Avg Wait</dt>
          <dd className="text-lg font-bold text-ink-900">{district.avgWaitMinutes}m</dd>
        </div>
      </dl>
    </div>
  );

  if (onSelect) {
    return (
      <button type="button" onClick={onSelect} className="block w-full text-left">
        {inner}
      </button>
    );
  }
  if (href) {
    return (
      <Link href={href} className="block">
        {inner}
      </Link>
    );
  }
  return inner;
}
