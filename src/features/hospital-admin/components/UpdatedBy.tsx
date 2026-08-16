import { formatDateTime } from "../utils/format";

type UpdatedByProps = {
  name: string;
  updatedAt: string;
};

export function UpdatedBy({ name, updatedAt }: UpdatedByProps) {
  return (
    <p className="text-xs text-ink-400">
      Last updated by {name} on {formatDateTime(updatedAt)}
    </p>
  );
}
