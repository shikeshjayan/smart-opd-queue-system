"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type DateRangeFilterProps = {
  from?: string;
  to?: string;
  onApply: (from: string, to: string) => void;
};

export function DateRangeFilter({ from, to, onApply }: DateRangeFilterProps) {
  const [fromDate, setFromDate] = useState(from ?? "");
  const [toDate, setToDate] = useState(to ?? "");

  function handleApply() {
    onApply(fromDate, toDate);
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-ink-700">From</span>
        <Input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          aria-label="From date"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-ink-700">To</span>
        <Input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          aria-label="To date"
        />
      </label>
      <Button type="button" onClick={handleApply}>
        Apply
      </Button>
    </div>
  );
}
