"use client";

import { useHospitalAdmin } from "../hospital-context";
import { Select } from "@/components/ui/select";

export function HospitalSwitcher() {
  const { hospitalId, hospitals, setHospitalId } = useHospitalAdmin();

  return (
    <label className="block w-full sm:w-72">
      <span className="mb-1 block text-xs font-medium text-ink-500">Hospital</span>
      <Select
        value={hospitalId}
        onChange={(e) => setHospitalId(e.target.value)}
        aria-label="Switch hospital"
        className="h-10"
      >
        {hospitals.map((hospital) => (
          <option key={hospital.id} value={hospital.id}>
            {hospital.name}
          </option>
        ))}
      </Select>
    </label>
  );
}
