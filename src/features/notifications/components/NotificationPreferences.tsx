"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { NotificationEventKey, NotificationPreferences } from "../types/notification.types";
import { EVENT_LABELS, SUPPORTED_CHANNELS } from "../types/notification.types";

type NotificationPreferencesProps = {
  preferences: NotificationPreferences;
  onSave: (preferences: NotificationPreferences) => Promise<void>;
  busy?: boolean;
};

const channelLabels: Record<string, string> = {
  in_app: "In-app",
  sms: "SMS",
  push: "Push",
};

export function NotificationPreferences({ preferences, onSave, busy = false }: NotificationPreferencesProps) {
  const [draft, setDraft] = useState<NotificationPreferences>(preferences);
  const [saved, setSaved] = useState(false);

  const eventKeys = Object.keys(EVENT_LABELS) as NotificationEventKey[];

  function toggle(key: NotificationEventKey) {
    setSaved(false);
    setDraft((prev) => ({
      ...prev,
      [key]: { ...prev[key], in_app: !prev[key].in_app },
    }));
  }

  async function handleSave() {
    await onSave(draft);
    setSaved(true);
  }

  return (
    <section aria-labelledby="preferences-title" className="flex flex-col gap-4">
      <h2 id="preferences-title" className="text-lg font-semibold text-ink-900">
        Notification Preferences
      </h2>

      <ul className="flex flex-col gap-3">
        {eventKeys.map((key) => {
          const { label, description } = EVENT_LABELS[key];
          const enabled = draft[key].in_app;
          return (
            <li
              key={key}
              className="flex items-start justify-between gap-4 rounded-card border border-ink-200 bg-surface p-4 shadow-card"
            >
              <div>
                <p className="text-sm font-medium text-ink-900">{label}</p>
                <p className="mt-0.5 text-xs text-ink-500">{description}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={enabled}
                onClick={() => toggle(key)}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-brand-600 ${
                  enabled ? "bg-brand-600" : "bg-ink-300"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                    enabled ? "translate-x-[22px]" : "translate-x-0.5"
                  }`}
                />
              </button>
            </li>
          );
        })}
      </ul>

      <div className="rounded-card border border-ink-200 bg-surface p-4 text-sm shadow-card">
        <p className="font-medium text-ink-900">Channels</p>
        <ul className="mt-2 flex flex-wrap gap-2">
          {SUPPORTED_CHANNELS.map((channel) => {
            const supported = channel === "in_app";
            return (
              <li
                key={channel}
                className={`rounded-full border px-3 py-1 text-xs font-medium ${
                  supported
                    ? "border-status-success-soft bg-status-success-soft text-status-success"
                    : "border-ink-200 bg-ink-100 text-ink-400"
                }`}
              >
                {channelLabels[channel]}
                {!supported && " · Not available"}
              </li>
            );
          })}
        </ul>
        <p className="mt-2 text-xs text-ink-500">
          Only channels supported by the system are shown. SMS and push notifications arrive with
          the backend integration.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={busy}>
          {busy ? "Saving…" : "Save Preferences"}
        </Button>
        {saved && <p className="text-sm text-status-success">Saved.</p>}
      </div>
    </section>
  );
}
