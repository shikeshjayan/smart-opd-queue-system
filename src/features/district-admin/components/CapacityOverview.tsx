import React from "react";

export interface CapacityOverviewRow {
  hospitalId: string;
  name: string;
  bedsTotal: number;
  bedsOccupied: number;
  bedsAvailable: number;
  occupancyRate: number;
  exceeded: boolean;
  critical: boolean;
}

export interface CapacityOverviewColumn {
  field: keyof CapacityOverviewRow;
  header: string;
  className?: string;
}

export const CapacityOverview: React.FC<{
  rows: CapacityOverviewRow[];
  columns: CapacityOverviewColumn[];
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
            <tr key={row.hospitalId} className={row.exceeded ? "bg-red-100" : ""}>
              <td className="font-medium">{row.name}</td>
              <td>{row.bedsOccupied}</td>
              <td>{row.bedsAvailable}</td>
              <td>{row.occupancyRate}%</td>
              <td>
                {row.exceeded ? (
                  <span className="text-red-600 font-medium">EXCEEDED</span>
                ) : (
                  "OK"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};