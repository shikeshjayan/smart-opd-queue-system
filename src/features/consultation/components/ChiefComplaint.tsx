import type { ChiefComplaint } from "@/services/consultation/types";
import { Input } from "@/components/ui/input";
import { SectionCard } from "./SectionCard";
import { textareaCls, inputCls, labelCls } from "../utils/classes";

type ChiefComplaintProps = {
  value: ChiefComplaint;
  onChange: (value: ChiefComplaint) => void;
};

export function ChiefComplaint({ value, onChange }: ChiefComplaintProps) {
  return (
    <SectionCard title="Chief Complaint">
      <div>
        <label className="block">
          <span className={labelCls}>Describe the reason for today&apos;s visit</span>
          <textarea
            className={textareaCls}
            value={value.text}
            onChange={(e) => onChange({ ...value, text: e.target.value })}
            placeholder="e.g. Chest discomfort for 2 days"
          />
        </label>
        <label className="mt-4 block max-w-xs">
          <span className={labelCls}>Duration</span>
          <Input
            className={inputCls}
            value={value.duration ?? ""}
            onChange={(e) => onChange({ ...value, duration: e.target.value })}
            placeholder="e.g. 2 days, since morning"
          />
        </label>
      </div>
    </SectionCard>
  );
}