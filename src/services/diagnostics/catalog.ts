import type { TestCatalogItem } from "./types";

export const testCatalogue: TestCatalogItem[] = [
  {
    id: "t_cbc",
    name: "Complete Blood Count",
    category: "laboratory",
    specimenType: "Blood",
    parameters: [
      { key: "hb", name: "Hemoglobin", unit: "g/dL", refLow: 13, refHigh: 17, criticalLow: 7, criticalHigh: 20, numeric: true },
      { key: "wbc", name: "WBC", unit: "/µL", refLow: 4000, refHigh: 11000, numeric: true },
      { key: "plt", name: "Platelets", unit: "lakh/µL", refLow: 1.5, refHigh: 4.5, criticalLow: 0.5, numeric: true },
    ],
  },
  {
    id: "t_fbg",
    name: "Blood Glucose (Fasting)",
    category: "laboratory",
    specimenType: "Blood",
    parameters: [
      { key: "glu", name: "Glucose (Fasting)", unit: "mg/dL", refLow: 70, refHigh: 110, criticalLow: 50, criticalHigh: 400, numeric: true },
    ],
  },
  {
    id: "t_lipid",
    name: "Lipid Profile",
    category: "laboratory",
    specimenType: "Blood",
    parameters: [
      { key: "chol", name: "Total Cholesterol", unit: "mg/dL", refHigh: 200, refText: "< 200", numeric: true },
      { key: "ldl", name: "LDL", unit: "mg/dL", refLow: 70, refHigh: 130, numeric: true },
      { key: "hdl", name: "HDL", unit: "mg/dL", refLow: 40, refHigh: 60, numeric: true },
      { key: "tg", name: "Triglycerides", unit: "mg/dL", refHigh: 150, refText: "< 150", numeric: true },
    ],
  },
  {
    id: "t_hba1c",
    name: "HbA1c",
    category: "laboratory",
    specimenType: "Blood",
    parameters: [{ key: "hba1c", name: "HbA1c", unit: "%", refLow: 4, refHigh: 5.6, numeric: true }],
  },
  {
    id: "t_rft",
    name: "Renal Function Test",
    category: "laboratory",
    specimenType: "Blood",
    parameters: [
      { key: "cr", name: "Creatinine", unit: "mg/dL", refLow: 0.6, refHigh: 1.3, criticalHigh: 5, numeric: true },
      { key: "urea", name: "Urea", unit: "mg/dL", refLow: 15, refHigh: 45, numeric: true },
    ],
  },
  {
    id: "t_lft",
    name: "Liver Function Test",
    category: "laboratory",
    specimenType: "Blood",
    parameters: [
      { key: "alt", name: "ALT", unit: "U/L", refLow: 7, refHigh: 56, numeric: true },
      { key: "ast", name: "AST", unit: "U/L", refLow: 10, refHigh: 40, numeric: true },
    ],
  },
  {
    id: "t_tsh",
    name: "Thyroid Stimulating Hormone",
    category: "laboratory",
    specimenType: "Blood",
    parameters: [{ key: "tsh", name: "TSH", unit: "mIU/L", refLow: 0.4, refHigh: 4.0, numeric: true }],
  },
  {
    id: "t_urine",
    name: "Urine Routine",
    category: "laboratory",
    specimenType: "Urine",
    parameters: [
      { key: "alb", name: "Albumin", refText: "Negative", numeric: false },
      { key: "sugar", name: "Sugar", refText: "Negative", numeric: false },
      { key: "pus", name: "Pus cells", refText: "Nil", numeric: false },
    ],
  },
  {
    id: "t_cxr",
    name: "Chest X-Ray",
    category: "imaging",
    specimenType: "Image",
    schedulingMode: "walk_in",
    parameters: [{ key: "impression", name: "Impression", numeric: false }],
  },
  {
    id: "t_usg",
    name: "Ultrasound Abdomen",
    category: "imaging",
    specimenType: "Image",
    schedulingMode: "walk_in",
    parameters: [{ key: "impression", name: "Impression", numeric: false }],
  },
  {
    id: "t_ct",
    name: "CT Scan",
    category: "imaging",
    specimenType: "Image",
    schedulingMode: "slot",
    slotMinutes: 20,
    dailyCapacity: 16,
    note: "Scheduled study — book a scanner slot (§9).",
    parameters: [{ key: "impression", name: "Impression", numeric: false }],
  },
  {
    id: "t_mri",
    name: "MRI Scan",
    category: "imaging",
    specimenType: "Image",
    schedulingMode: "slot",
    slotMinutes: 30,
    dailyCapacity: 10,
    note: "Scheduled study — book a scanner slot (§9).",
    parameters: [{ key: "impression", name: "Impression", numeric: false }],
  },
  {
    id: "t_echo",
    name: "Echocardiography",
    category: "other",
    specimenType: "Tracing",
    schedulingMode: "walk_in",
    parameters: [{ key: "impression", name: "Impression", numeric: false }],
  },
  {
    id: "t_ecg",
    name: "ECG (12-lead)",
    category: "other",
    specimenType: "Tracing",
    schedulingMode: "walk_in",
    parameters: [{ key: "impression", name: "Impression", numeric: false }],
  },
];

export function testById(id: string): TestCatalogItem | undefined {
  return testCatalogue.find((test) => test.id === id);
}

export function isLabTest(item: TestCatalogItem): boolean {
  return item.category === "laboratory";
}
