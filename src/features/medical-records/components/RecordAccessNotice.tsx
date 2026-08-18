import type { RecordAudience } from "../types/medical-record.types";

type RecordAccessNoticeProps = {
  audience: RecordAudience;
};

export function RecordAccessNotice({ audience }: RecordAccessNoticeProps) {
  const text =
    audience === "doctor"
      ? "Clinical information. Accessed as part of the current consultation for this patient's care."
      : "This is your personal medical record. Access is limited to you and the care team involved in your treatment.";

  return (
    <div className="flex items-center gap-2 rounded-card border border-status-info-soft bg-status-info-soft px-4 py-3">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="h-4 w-4 shrink-0 text-status-info"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16Zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5Z"
          clipRule="evenodd"
        />
      </svg>
      <p className="text-xs text-status-info">{text}</p>
    </div>
  );
}