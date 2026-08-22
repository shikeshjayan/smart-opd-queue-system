import React from "react";

export interface ReferralSummaryRow {
  id: string;
  fromHospitalId: string;
  fromHospitalName: string;
  toHospitalId: string;
  toHospitalName: string;
  count: number;
  periodLabel: string;
}

export interface ReferralSummaryColumn {
  field: keyof ReferralSummaryRow;
  header: string;
  className?: string;
}

export const ReferralSummary: React.FC<{
  rows: ReferralSummaryRow[];
  columns: ReferralSummaryColumn[];
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
            <tr key={row.id} className="hover:bg-gray-50">
              <td>{row.fromHospitalName}</td>
              <td>{row.toHospitalName}</td>
              <td className="text-right">{row.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};