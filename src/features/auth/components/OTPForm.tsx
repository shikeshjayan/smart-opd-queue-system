"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type OTPFormProps = {
  description?: string;
  onVerify: (otp: string) => Promise<boolean> | boolean;
  onResend?: () => void;
  busy?: boolean;
};

export function OTPForm({ description, onVerify, onResend, busy }: OTPFormProps) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [error, setError] = useState<string | null>(null);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const code = digits.join("");

  function handleChange(index: number, value: string) {
    const cleaned = value.replace(/\D/g, "").slice(0, 1);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = cleaned;
      return next;
    });
    if (cleaned && index < 5) inputsRef.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  }

  async function handleSubmit() {
    setError(null);
    if (code.length !== 6) {
      setError("Please enter the 6-digit code.");
      return;
    }
    const ok = await onVerify(code);
    if (!ok) setError("Invalid or expired code. Please try again.");
  }

  return (
    <div>
      <p className="text-sm text-ink-500">{description}</p>
      <div className="mt-4 flex justify-center gap-2">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              inputsRef.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            className="h-12 w-10 rounded-btn border border-ink-300 text-center text-lg font-semibold text-ink-900 focus:outline-2 focus:outline-brand-600 disabled:opacity-50"
            aria-label={`Digit ${index + 1}`}
          />
        ))}
      </div>
      {error && (
        <p role="alert" className="mt-3 text-center text-sm text-status-danger">
          {error}
        </p>
      )}
      <Button type="button" className="mt-5 w-full" disabled={busy} onClick={handleSubmit}>
        {busy ? "Verifying..." : "Verify & Sign In"}
      </Button>
      {onResend && (
        <button
          type="button"
          onClick={onResend}
          className="mt-3 block w-full text-center text-sm font-medium text-brand-700 hover:underline"
        >
          Resend code
        </button>
      )}
    </div>
  );
}