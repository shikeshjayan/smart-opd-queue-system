"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useHospitalAdmin } from "@/features/hospital-admin/hospital-context";
import {
  useAdminMutations,
  useAdminSettings,
} from "@/features/hospital-admin/hooks/useHospitalAdmin";
import { PageHeader } from "@/features/hospital-admin/components/PageHeader";
import { UpdatedBy } from "@/features/hospital-admin/components/UpdatedBy";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";
import { SuccessMessage } from "@/components/feedback/success-message";
import type { AdminSettings } from "@/types";
import type { AdminSettingsInput } from "@/services/admin/types";

export default function SettingsPage() {
  const { hospitalId } = useHospitalAdmin();
  const { data: settings, isLoading, error, reload } = useAdminSettings(hospitalId);
  const mutations = useAdminMutations();
  const [saved, setSaved] = useState(false);

  const [prevSettings, setPrevSettings] = useState<AdminSettings | undefined>(undefined);
  const [draft, setDraft] = useState<AdminSettingsInput | null>(null);

  if (settings && settings !== prevSettings) {
    setPrevSettings(settings);
    setDraft({
      queueHealthThresholds: { ...settings.queueHealthThresholds },
      opdOpenTime: settings.opdOpenTime,
      opdCloseTime: settings.opdCloseTime,
      tokenWindowMinutes: settings.tokenWindowMinutes,
    });
  }

  const values: AdminSettingsInput = draft ?? {
    queueHealthThresholds: { warning: 10, critical: 20 },
    opdOpenTime: "09:00",
    opdCloseTime: "17:00",
    tokenWindowMinutes: 30,
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (error || !settings) {
    return <ErrorState message={error ?? "Unable to load settings."} onRetry={reload} />;
  }

  function setWarning(value: number) {
    setDraft({
      ...values,
      queueHealthThresholds: { ...values.queueHealthThresholds, warning: value },
    });
  }

  function setCritical(value: number) {
    setDraft({
      ...values,
      queueHealthThresholds: { ...values.queueHealthThresholds, critical: value },
    });
  }

  function setOpdOpenTime(value: string) {
    setDraft({ ...values, opdOpenTime: value });
  }

  function setOpdCloseTime(value: string) {
    setDraft({ ...values, opdCloseTime: value });
  }

  function setTokenWindowMinutes(value: number) {
    setDraft({ ...values, tokenWindowMinutes: value });
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const result = await mutations.saveSettings(hospitalId, values);
    if (result) {
      setSaved(true);
      reload();
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Settings" description="Hospital-wide configuration." />

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Queue Health Thresholds</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm text-ink-500">
              Queues are flagged based on the number of patients waiting. When waiting
              reaches the warning threshold the queue is marked <strong>High Wait</strong>,
              and at the critical threshold it is marked <strong>Critical</strong>.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-ink-700">
                  Warning threshold (waiting patients)
                </span>
                <Input
                  type="number"
                  min={1}
                  required
                  value={values.queueHealthThresholds.warning}
                  onChange={(e) => setWarning(parseInt(e.target.value, 10) || 0)}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-ink-700">
                  Critical threshold (waiting patients)
                </span>
                <Input
                  type="number"
                  min={1}
                  required
                  value={values.queueHealthThresholds.critical}
                  onChange={(e) => setCritical(parseInt(e.target.value, 10) || 0)}
                />
              </label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>OPD Hours</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-ink-700">Opening time</span>
                <Input
                  type="time"
                  required
                  value={values.opdOpenTime}
                  onChange={(e) => setOpdOpenTime(e.target.value)}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-ink-700">Closing time</span>
                <Input
                  type="time"
                  required
                  value={values.opdCloseTime}
                  onChange={(e) => setOpdCloseTime(e.target.value)}
                />
              </label>
            </div>
            <label className="block max-w-xs">
              <span className="mb-1 block text-sm font-medium text-ink-700">
                Token window (minutes)
              </span>
              <Input
                type="number"
                min={5}
                required
                value={values.tokenWindowMinutes}
                onChange={(e) => setTokenWindowMinutes(parseInt(e.target.value, 10) || 0)}
              />
            </label>
          </CardContent>
        </Card>

        {saved && <SuccessMessage message="Settings saved successfully." />}
        {mutations.error && <p className="text-sm text-status-danger">{mutations.error}</p>}

        <div className="flex flex-col gap-2">
          <Button type="submit" disabled={mutations.busy} className="self-start">
            {mutations.busy ? "Saving..." : "Save Settings"}
          </Button>
          <UpdatedBy name={settings.updatedBy} updatedAt={settings.updatedAt} />
        </div>
      </form>
    </div>
  );
}
