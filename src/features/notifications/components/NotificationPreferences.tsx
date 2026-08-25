"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import type { NotificationPreference } from "../types/notification.types";

const CHANNEL_LABELS = {
  sms: "SMS",
  email: "Email",
  push: "Push",
};

const CATEGORY_LABELS = {
  appointmentReminders: "Appointment reminders",
  queueUpdates: "Queue updates",
  resultNotifications: "Lab/diagnostic results",
  prescriptionNotifications: "Prescription ready",
  followUpReminders: "Follow-up reminders",
  announcements: "Hospital announcements",
};

type NotificationPreferencesProps = {
  prefs: NotificationPreference | null;
  onSave: (input: Partial<NotificationPreference>) => Promise<void>;
  loading?: boolean;
};

export function NotificationPreferences({ prefs, onSave, loading = false }: NotificationPreferencesProps) {
  const [draft, setDraft] = useState<Partial<NotificationPreference>>({
    sms: prefs?.sms ?? true,
    email: prefs?.email ?? false,
    push: prefs?.push ?? true,
    appointmentReminders: prefs?.appointmentReminders ?? true,
    queueUpdates: prefs?.queueUpdates ?? true,
    resultNotifications: prefs?.resultNotifications ?? true,
    prescriptionNotifications: prefs?.prescriptionNotifications ?? true,
    followUpReminders: prefs?.followUpReminders ?? true,
    announcements: prefs?.announcements ?? true,
    locale: prefs?.locale ?? "en",
  });
  const [saved, setSaved] = useState(false);

  const channelKeys = Object.keys(CHANNEL_LABELS) as Array<keyof typeof CHANNEL_LABELS>;
  const categoryKeys = Object.keys(CATEGORY_LABELS) as Array<keyof typeof CATEGORY_LABELS>;

  async function handleSave() {
    await onSave(draft);
    setSaved(true);
  }

  return (
    <section aria-labelledby="preferences-title" className="flex flex-col gap-6">
      <h2 id="preferences-title" className="text-lg font-semibold text-ink-900">
        Notification Preferences
      </h2>

      <div className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
        <h3 className="font-medium mb-3">Channels</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {channelKeys.map((key) => (
            <label key={key} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={!!draft[key]}
                onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.checked }))}
                className="rounded-sm border-ink-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-sm text-ink-700">{CHANNEL_LABELS[key]}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
        <h3 className="font-medium mb-3">Categories</h3>
        <div className="grid gap-3">
          {categoryKeys.map((key) => (
            <label key={key} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={!!draft[key]}
                onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.checked }))}
                className="rounded-sm border-ink-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-sm text-ink-700">{CATEGORY_LABELS[key]}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
        <h3 className="font-medium mb-3">Language</h3>
        <select
          value={draft.locale ?? "en"}
          onChange={(e) => setDraft((d) => ({ ...d, locale: e.target.value }))}
          className="h-11 w-48 rounded-btn border border-ink-300 bg-surface px-3 text-sm"
        >
          <option value="en">English</option>
          <option value="ml">മലയാളം</option>
        </select>
      </div>


      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading || saved}>
          {saved ? "Saved" : loading ? "Saving…" : "Save preferences"}
        </Button>
      </div>
    </section>
  );
}