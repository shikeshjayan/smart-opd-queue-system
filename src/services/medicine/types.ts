export type MedicineCategory =
  | "analgesic"
  | "antibiotic"
  | "antihypertensive"
  | "antidiabetic"
  | "statin"
  | "antiplatelet"
  | "antihistamine"
  | "gastro"
  | "cough_cold"
  | "bronchodilator"
  | "vitamin"
  | "other";

export type Medicine = {
  id: string;
  genericName: string;
  brandNames: string[];
  category: MedicineCategory;
  form: string;
  strengths: string[];
  typicalFrequencies: string[];
  route?: string;
  maxDailyDoseMg?: number;
  allergyGroup?: "penicillin" | "sulfa";
  packageNote?: string;
};

export type SafetyWarningKind = "allergy" | "interaction" | "max_dose";

export type SafetyWarning = {
  kind: SafetyWarningKind;
  severity: "danger" | "warning" | "info";
  message: string;
  medicineIds: string[];
};

export type MedicineDose = {
  medicineId: string;
  dosage: string;
  frequency: string;
  dailyDoseMg?: number;
};