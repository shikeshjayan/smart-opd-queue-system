import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", ...props }, ref) => (
    <input
      ref={ref}
      className={`h-11 w-full rounded-btn border border-ink-300 bg-surface px-3 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-2 focus:outline-brand-600 disabled:opacity-50 ${className}`}
      {...props}
    />
  )
);

Input.displayName = "Input";
