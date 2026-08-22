import React from "react";

export interface AuditTimelineItem {
  id: string;
  at: string;
  actorName: string;
  actorRole: string;
  action: string;
  targetType: string;
  targetId: string;
  summary: string;
}

export interface AuditTimelineColumn {
  field: keyof AuditTimelineItem;
  header: string;
  className?: string;
}

export const AuditTimeline: React.FC<{
  items: AuditTimelineItem[];
  columns: AuditTimelineColumn[];
}> = ({ items, columns }) => {
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
          {items.map((item) => (
            <tr key={item.id} className="border-b border-ink-100">
              {columns.map((col) => {
                const value: string = {
                  id: item.id,
                  at: item.at,
                  actorName: item.actorName,
                  actorRole: item.actorRole,
                  action: item.action,
                  targetType: item.targetType,
                  targetId: item.targetId,
                  summary: item.summary,
                }[col.field] ?? "";
                return (
                  <td key={col.field} className="text-sm text-ink-600">
                    {value}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};