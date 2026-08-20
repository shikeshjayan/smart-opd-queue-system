"use client";

import {
  useAnnouncement,
  type AnnouncementLanguage,
} from "../hooks/useAnnouncement";

export function AudioAnnouncementPanel() {
  const {
    supported,
    enabled,
    volume,
    language,
    setEnabled,
    setVolume,
    setLanguage,
  } = useAnnouncement();

  if (!supported) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-card border border-ink-200 bg-surface p-4 text-sm shadow-card">
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="h-4 w-4 rounded border-ink-300 accent-brand-600"
        />
        <span className="font-medium text-ink-900">Audio announcements</span>
      </label>

      <label className="flex items-center gap-2">
        <span className="text-ink-500">Language</span>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as AnnouncementLanguage)}
          aria-label="Announcement language"
          className="rounded-btn border border-ink-300 bg-surface px-2 py-1 text-sm text-ink-900"
        >
          <option value="en">English</option>
          <option value="ml">Malayalam</option>
        </select>
      </label>

      <label className="flex items-center gap-2">
        <span className="text-ink-500">Volume</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          aria-label="Announcement volume"
          className="accent-brand-600"
        />
        <span className="tabular-nums text-ink-500">{Math.round(volume * 100)}%</span>
      </label>
    </div>
  );
}