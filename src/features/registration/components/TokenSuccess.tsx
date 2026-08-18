"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { OPDToken } from "../types/registration.types";
import { printToken } from "@/features/token/utils/print";

type TokenSuccessProps = {
  token: OPDToken;
  hospitalName: string;
  doctorName: string;
  onRegisterAnother: () => void;
};

export function TokenSuccess({ token, hospitalName, doctorName, onRegisterAnother }: TokenSuccessProps) {
  const [notified, setNotified] = useState(false);

  function handlePrint() {
    printToken({
      tokenNumber: token.tokenNumber,
      patientName: token.patientName,
      departmentName: token.departmentName,
      opdName: token.opdName,
      hospitalName,
      date: token.createdAt,
      waitMinutes: 30,
    });
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="rounded-card bg-brand-600 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-white">
        Token Generated
      </div>
      <div
        aria-label={`Token ${token.tokenNumber}`}
        className="flex h-40 w-40 items-center justify-center rounded-full bg-brand-700 text-5xl font-bold text-white shadow-token"
      >
        {token.tokenNumber}
      </div>
      <div className="text-center">
        <p className="text-lg font-semibold text-ink-900">{token.patientName}</p>
        <p className="text-sm text-ink-500">
          {token.departmentName} &middot; {token.opdName}
        </p>
        <p className="text-sm text-ink-500">{doctorName}</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button variant="outline" onClick={handlePrint}>
          Print
        </Button>
        <Button variant="outline" onClick={() => setNotified(true)} disabled={notified}>
          {notified ? "Notification sent" : "Send Notification"}
        </Button>
      </div>

      <button
        type="button"
        onClick={onRegisterAnother}
        className="mt-2 h-12 w-full max-w-sm rounded-btn bg-brand-600 text-sm font-medium text-white transition-colors hover:bg-brand-700"
      >
        Register Another Patient
      </button>
    </div>
  );
}