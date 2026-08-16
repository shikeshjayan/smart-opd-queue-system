import type { HTMLAttributes } from "react";

type SkeletonProps = HTMLAttributes<HTMLDivElement> & {
  height?: string;
  width?: string;
};

export function Skeleton({ height = "h-4", width = "w-full", className = "", ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded bg-ink-100 ${height} ${width} ${className}`}
      {...props}
    />
  );
}
