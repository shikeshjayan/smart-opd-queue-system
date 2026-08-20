import type { PrescriptionDraftItem } from "@/services/prescription/types";
import { SectionCard } from "./SectionCard";
import { PrescriptionComposer } from "@/features/prescription/components/PrescriptionComposer";
import { textareaCls, labelCls } from "../utils/classes";

type TreatmentProps = {
  treatmentPlan: string;
  onTreatmentPlanChange: (value: string) => void;
  prescriptionItems: PrescriptionDraftItem[];
  onPrescriptionItemsChange: (items: PrescriptionDraftItem[]) => void;
  prescriptionInstructions: string;
  onPrescriptionInstructionsChange: (value: string) => void;
  allergies: string[];
};

export function Treatment({
  treatmentPlan,
  onTreatmentPlanChange,
  prescriptionItems,
  onPrescriptionItemsChange,
  prescriptionInstructions,
  onPrescriptionInstructionsChange,
  allergies,
}: TreatmentProps) {
  return (
    <SectionCard title="Treatment">
      <div className="flex flex-col gap-5">
        <label className="block">
          <span className={labelCls}>Treatment plan</span>
          <textarea
            className={textareaCls}
            value={treatmentPlan}
            onChange={(e) => onTreatmentPlanChange(e.target.value)}
            placeholder="Outline the treatment plan for this visit"
          />
        </label>

        <div className="border-t border-ink-100 pt-4">
          <p className="mb-3 flex items-center gap-2 text-sm font-medium text-ink-900">
            Prescription
            {prescriptionItems.length > 0 && (
              <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">
                {prescriptionItems.length}
              </span>
            )}
          </p>
          <PrescriptionComposer
            items={prescriptionItems}
            onChange={onPrescriptionItemsChange}
            allergies={allergies}
            instructions={prescriptionInstructions}
            onInstructionsChange={onPrescriptionInstructionsChange}
          />
        </div>
      </div>
    </SectionCard>
  );
}