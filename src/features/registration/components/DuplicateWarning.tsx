"use client";

import { Button } from "@/components/ui/button";
import type { PotentialDuplicate } from "../types/registration.types";

type DuplicateWarningProps = {
  matches: PotentialDuplicate[];
  onUseExisting: (patientId: string) => void;
  onContinue: () => void;
  busy?: boolean;
};

export function DuplicateWarning({ matches, onUseExisting, onContinue, busy }: DuplicateWarningProps) {
  return (
    <div className="rounded-card border border-status-warning-soft bg-status-warning-soft p-4">
      <p className="font-medium text-status-warning">
        Possible duplicate patient found
      </p>
      <p className="mt-1 text-sm text-ink-700">
        Please verify before creating a new record. Medical history stays fragmented when the same
        person has multiple patient IDs.
      </p>
      <ul className="mt-3 flex flex-col gap-2">
        {matches.map((match) => (
          <li
            key={match.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-card border border-ink-200 bg-surface p-3"
          >
            <div>
              <p className="font-medium text-ink-900">{match.name}</p>
              <p className="font-mono text-xs text-ink-500">
                {match.id} &middot; Age {match.age} &middot; Mobile ending {match.mobileLast4}
              </p>
            </div>
            <Button variant="outline" size="sm" disabled={busy} onClick={() => onUseExisting(match.id)}>
              Use Existing
            </Button>
          </li>
        ))}
      </ul>
      <div className="mt-3">
        <Button variant="ghost" size="sm" disabled={busy} onClick={onContinue}>
          Continue Registration
        </Button>
      </div>
    </div>
  );
}