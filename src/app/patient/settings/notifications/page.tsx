"use client";

import { Suspense } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { NotificationPreferences } from "@/features/notifications/components/NotificationPreferences";
import { useNotificationPreferences } from "@/features/notifications/hooks/useNotifications";
import { PageHeader } from "@/features/hospital-admin/components/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";

function PreferencesContent() {
  const { user } = useAuth();
  const { prefs, isLoading, save } = useNotificationPreferences();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Notification Preferences"
        description="Choose how you want to be notified about your healthcare journey."
      />
      <NotificationPreferences prefs={prefs} onSave={save} loading={false} />
    </div>
  );
}

export default function PatientNotificationSettingsPage() {
  return (
    <Suspense fallback={<div className="flex flex-col gap-4"><Skeleton className="h-10 w-1/2" /><Skeleton className="h-48 w-full" /></div>}>
      <PreferencesContent />
    </Suspense>
  );
}