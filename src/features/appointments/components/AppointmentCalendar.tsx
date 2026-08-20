"use client";

import { useState } from "react";

type AppointmentCalendarProps = {
  dates: string[];
  selectedDate?: string;
  onSelect: (date: string) => void;
};

function monthLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

function cellsFor(year: number, month: number): Array<string | null> {
  const first = new Date(year, month, 1);
  const totalDays = new Date(year, month + 1, 0).getDate();
  const lead = (first.getDay() + 6) % 7;
  const cells: Array<string | null> = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let day = 1; day <= totalDays; day++) {
    cells.push(`${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
  }
  return cells;
}

const TODAY = new Date().toISOString().slice(0, 10);
const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

export function AppointmentCalendar({ dates, selectedDate, onSelect }: AppointmentCalendarProps) {
  const now = new Date();
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const cells = cellsFor(cursor.year, cursor.month);
  const dateMap = new Set(dates);

  const move = (delta: number) => {
    setCursor((prev) => {
      let month = prev.month + delta;
      let year = prev.year;
      if (month < 0) {
        month = 11;
        year -= 1;
      } else if (month > 11) {
        month = 0;
        year += 1;
      }
      return { year, month };
    });
  };

  return (
    <div className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-ink-900">{monthLabel(cursor.year, cursor.month)}</p>
        <div className="flex gap-1">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => move(-1)}
            className="rounded-btn border border-ink-300 px-2 py-1 text-sm text-ink-600 hover:bg-ink-100"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => move(1)}
            className="rounded-btn border border-ink-300 px-2 py-1 text-sm text-ink-600 hover:bg-ink-100"
          >
            ›
          </button>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((weekday) => (
          <span key={weekday} className="text-[11px] font-medium uppercase text-ink-400">
            {weekday}
          </span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((date, index) =>
          date === null ? (
            <span key={`blank-${index}`} aria-hidden="true" />
          ) : (
            <button
              key={date}
              type="button"
              onClick={() => onSelect(date)}
              disabled={date < TODAY}
              aria-pressed={selectedDate === date}
              className={`relative flex h-9 items-center justify-center rounded-btn text-sm transition-colors disabled:opacity-40 ${
                selectedDate === date
                  ? "bg-brand-600 font-semibold text-white"
                  : "text-ink-700 hover:bg-ink-100"
              }`}
            >
              {Number(date.slice(8, 10))}
              {dateMap.has(date) && (
                <span
                  aria-hidden="true"
                  className={`absolute bottom-1 h-1 w-1 rounded-full ${selectedDate === date ? "bg-white" : "bg-brand-600"}`}
                />
              )}
            </button>
          )
        )}
      </div>
    </div>
  );
}