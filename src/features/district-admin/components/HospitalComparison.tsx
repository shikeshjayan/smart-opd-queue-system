import React from "react";
// import { DistrictMapPinProps } from "../DistrictMap";

export interface HospitalComparisonColumn {
  field: keyof HospitalComparisonRow;
  header: string;
  className?: string;
}

export interface HospitalComparisonRow {
  hospitalId: string;
  name: string;
  outpatients: number;
  inpatients: number;
  bedsAvailable: number;
  bedsTotal: number;
  occupancyRate: number;
  avgWaitTime: number;
}

export const HospitalComparison: React.FC<{
  rows: HospitalComparisonRow[];
  columns: HospitalComparisonColumn[];
}> = ({ rows, columns }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border border-gray-200 rounded-lg">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.field} className={col.className || ""}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.hospitalId} className="hover:bg-gray-50">
              <td className="font-medium">{row.name}</td>
              <td>{row.outpatients}</td>
              <td>{row.inpatients}</td>
              <td>{row.bedsAvailable}/{row.bedsTotal}</td>
              <td>{row.occupancyRate}%</td>
              <td>{row.avgWaitTime} min</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};