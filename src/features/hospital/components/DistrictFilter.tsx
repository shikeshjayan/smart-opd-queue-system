"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { DISTRICTS, type DistrictId } from "@/config/districts";
import { Select } from "@/components/ui/select";

export function DistrictFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const district = searchParams.get("district") ?? "";

  function onDistrictChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("district", value);
    } else {
      params.delete("district");
    }
    router.replace(`/patient/hospitals${params.size > 0 ? `?${params.toString()}` : ""}`);
  }

  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink-700">District</span>
      <Select
        value={district}
        onChange={(e) => onDistrictChange(e.target.value)}
        aria-label="Filter hospitals by district"
      >
        <option value="">All Districts</option>
        {DISTRICTS.map((d) => (
          <option key={d.id} value={d.id as DistrictId}>
            {d.name}
          </option>
        ))}
      </Select>
    </label>
  );
}
