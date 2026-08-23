"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useStateAnnouncements, useStateMutations } from "../hooks/useStateAdminData";
import type { AnnouncementStatus, AnnouncementTargetType } from "../types/state-admin.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";
import { EmptyState } from "@/components/feedback/empty-state";

const statusVariant: Record<AnnouncementStatus, "default" | "info" | "success" | "warning"> = {
  draft: "default",
  scheduled: "info",
  published: "success",
  expired: "warning",
};

const statusLabel: Record<AnnouncementStatus, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  published: "Published",
  expired: "Expired",
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

export function AnnouncementManager() {
  const { data, isLoading, error, reload } = useStateAnnouncements();
  const { busy, error: mutationError, publishAnnouncement } = useStateMutations();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetType, setTargetType] = useState<AnnouncementTargetType>("all");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || !message.trim()) return;
    const result = await publishAnnouncement({
      title: title.trim(),
      message: message.trim(),
      targetType,
      targetIds: [],
      publishedAt: null,
      scheduledAt: null,
      expiresAt: null,
    });
    if (result) {
      setTitle("");
      setMessage("");
      setTargetType("all");
      reload();
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSubmit} className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
        <h3 className="font-semibold text-ink-900">New Announcement</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            aria-label="Announcement title"
            required
          />
          <Select
            value={targetType}
            onChange={(e) => setTargetType(e.target.value as AnnouncementTargetType)}
            aria-label="Audience"
          >
            <option value="all">All hospitals</option>
            <option value="districts">Districts</option>
            <option value="hospitals">Hospitals</option>
          </Select>
        </div>
        <Input
          className="mt-3"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Message"
          aria-label="Announcement message"
          required
        />
        {mutationError && <p className="mt-2 text-sm text-status-danger">{mutationError}</p>}
        <div className="mt-3 flex justify-end">
          <Button type="submit" disabled={busy || !title.trim() || !message.trim()}>
            {busy ? "Publishing..." : "Publish"}
          </Button>
        </div>
      </form>

      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : error || !data ? (
        <ErrorState message={error ?? "Could not load announcements"} onRetry={reload} />
      ) : data.length === 0 ? (
        <EmptyState title="No announcements" description="Published announcements will appear here." />
      ) : (
        <ul className="flex flex-col gap-3">
          {data.map((announcement) => (
            <li key={announcement.id} className="rounded-card border border-ink-200 bg-surface p-4 shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="font-semibold text-ink-900">{announcement.title}</h4>
                <Badge variant={statusVariant[announcement.status]}>{statusLabel[announcement.status]}</Badge>
              </div>
              <p className="mt-1 text-sm text-ink-700">{announcement.message}</p>
              <p className="mt-2 text-xs text-ink-500">
                By {announcement.publishedBy} &middot; Published {formatDate(announcement.publishedAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
