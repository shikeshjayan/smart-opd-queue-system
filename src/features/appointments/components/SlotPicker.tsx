import type { AppointmentSlot } from "@/services/appointments/types";
import { formatSlotTime } from "../utils/appointments-validation";

type SlotPickerProps = {
  slots: AppointmentSlot[];
  selectedTime?: string;
  onSelect: (time: string) => void;
};

export function SlotPicker({ slots, selectedTime, onSelect }: SlotPickerProps) {
  if (slots.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {slots.map((slot) => {
        const full = slot.available <= 0;
        const selected = selectedTime === slot.time;
        return (
          <button
            key={slot.time}
            type="button"
            disabled={full}
            aria-pressed={selected}
            onClick={() => onSelect(slot.time)}
            className={`min-w-24 rounded-btn border px-3 py-2 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 ${
              selected
                ? "border-brand-600 bg-brand-600 text-white"
                : "border-ink-300 text-ink-700 hover:bg-ink-100"
            }`}
          >
            {formatSlotTime(slot.time)}
          </button>
        );
      })}
    </div>
  );
}