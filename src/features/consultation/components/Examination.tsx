import type { Examination as ExaminationType } from "@/services/consultation/types";
import { SectionCard } from "./SectionCard";
import { textareaCls, labelCls } from "../utils/classes";

type ExaminationProps = {
  value: ExaminationType;
  onChange: (value: ExaminationType) => void;
};

export function Examination({ value, onChange }: ExaminationProps) {
  return (
    <SectionCard title="Clinical Examination">
      <div className="flex flex-col gap-4">
        <label className="block">
          <span className={labelCls}>General</span>
          <textarea
            className={textareaCls}
            value={value.general ?? ""}
            onChange={(e) => onChange({ ...value, general: e.target.value })}
            placeholder="General condition, built, pallor, etc."
          />
        </label>
        <label className="block">
          <span className={labelCls}>System Examination</span>
          <textarea
            className={textareaCls}
            value={value.system ?? ""}
            onChange={(e) => onChange({ ...value, system: e.target.value })}
            placeholder="Cardiovascular, respiratory, abdominal, CNS findings"
          />
        </label>
        <label className="block">
          <span className={labelCls}>Other Findings</span>
          <textarea
            className={textareaCls}
            value={value.other ?? ""}
            onChange={(e) => onChange({ ...value, other: e.target.value })}
            placeholder="Investigations done, additional remarks"
          />
        </label>
      </div>
    </SectionCard>
  );
}