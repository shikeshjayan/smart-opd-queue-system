import type { HTMLAttributes, TableHTMLAttributes, TdHTMLAttributes } from "react";

export function Table({ className = "", ...props }: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={`w-full text-sm ${className}`} {...props} />
    </div>
  );
}

export function TableHeader({ className = "", ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={`border-b border-ink-200 ${className}`} {...props} />;
}

export function TableBody({ className = "", ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={`divide-y divide-ink-100 ${className}`} {...props} />;
}

export function TableRow({ className = "", ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={`hover:bg-surface-muted ${className}`} {...props} />;
}

export function TableHead({ className = "", ...props }: HTMLAttributes<HTMLTableCellElement>) {
  return <th className={`px-4 py-3 text-left font-medium text-ink-500 ${className}`} {...props} />;
}

export function TableCell({ className = "", ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={`px-4 py-3 ${className}`} {...props} />;
}
