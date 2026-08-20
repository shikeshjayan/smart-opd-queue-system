import type { Medicine, MedicineDose, SafetyWarning } from "./types";

const delay = () => new Promise((resolve) => setTimeout(resolve, 250));

const medicines: Medicine[] = [
  { id: "med_par", genericName: "Paracetamol", brandNames: ["Calpol", "Dolo", "Crocin"], category: "analgesic", form: "Tablet", strengths: ["500 mg", "650 mg"], typicalFrequencies: ["1-0-1", "1-1-1"], maxDailyDoseMg: 3000 },
  { id: "med_ibu", genericName: "Ibuprofen", brandNames: ["Brufen", "Combiflam"], category: "analgesic", form: "Tablet", strengths: ["200 mg", "400 mg"], typicalFrequencies: ["0-1-0", "1-1-1"], maxDailyDoseMg: 1200, packageNote: "Avoid in gastritis and renal impairment." },
  { id: "med_amox", genericName: "Amoxicillin", brandNames: ["Mox", "Amoxil"], category: "antibiotic", form: "Capsule", strengths: ["250 mg", "500 mg"], typicalFrequencies: ["1-1-1"], allergyGroup: "penicillin" },
  { id: "med_amox_clav", genericName: "Amoxicillin + Clavulanate", brandNames: ["Augmentin", "Moxikind-CV"], category: "antibiotic", form: "Tablet", strengths: ["625 mg", "1000 mg"], typicalFrequencies: ["1-1-1"], allergyGroup: "penicillin" },
  { id: "med_azithro", genericName: "Azithromycin", brandNames: ["Azithral", "Zithro"], category: "antibiotic", form: "Tablet", strengths: ["250 mg", "500 mg"], typicalFrequencies: ["1-0-0"] },
  { id: "med_cipro", genericName: "Ciprofloxacin", brandNames: ["Ciplox", "Ciprobay"], category: "antibiotic", form: "Tablet", strengths: ["250 mg", "500 mg"], typicalFrequencies: ["1-0-1"] },
  { id: "med_cotri", genericName: "Cotrimoxazole", brandNames: ["Septrin", "Bactrim"], category: "antibiotic", form: "Tablet", strengths: ["480 mg", "960 mg"], typicalFrequencies: ["1-0-1"], allergyGroup: "sulfa" },
  { id: "med_metro", genericName: "Metronidazole", brandNames: ["Flagyl", "Metrogyl"], category: "antibiotic", form: "Tablet", strengths: ["200 mg", "400 mg"], typicalFrequencies: ["1-1-1"] },
  { id: "med_metform", genericName: "Metformin", brandNames: ["Glycomet-GP", "Metlong"], category: "antidiabetic", form: "Tablet", strengths: ["500 mg", "850 mg", "1000 mg"], typicalFrequencies: ["1-0-1", "1-0-0"], maxDailyDoseMg: 2000 },
  { id: "med_glimep", genericName: "Glimepiride", brandNames: ["Amaryl", "Glimer"], category: "antidiabetic", form: "Tablet", strengths: ["1 mg", "2 mg", "3 mg"], typicalFrequencies: ["1-0-0"], maxDailyDoseMg: 4 },
  { id: "med_amlod", genericName: "Amlodipine", brandNames: ["Amlong", "Amlocard"], category: "antihypertensive", form: "Tablet", strengths: ["2.5 mg", "5 mg", "10 mg"], typicalFrequencies: ["1-0-0"], maxDailyDoseMg: 10 },
  { id: "med_telm", genericName: "Telmisartan", brandNames: ["Telmikind", "Telma"], category: "antihypertensive", form: "Tablet", strengths: ["20 mg", "40 mg", "80 mg"], typicalFrequencies: ["1-0-0"], maxDailyDoseMg: 80 },
  { id: "med_enal", genericName: "Enalapril", brandNames: ["Enalavin", "Enaace"], category: "antihypertensive", form: "Tablet", strengths: ["2.5 mg", "5 mg", "10 mg"], typicalFrequencies: ["1-0-0"], maxDailyDoseMg: 40 },
  { id: "med_atorvast", genericName: "Atorvastatin", brandNames: ["Atorva", "Atorsave"], category: "statin", form: "Tablet", strengths: ["10 mg", "20 mg", "40 mg"], typicalFrequencies: ["0-1-0"], maxDailyDoseMg: 80 },
  { id: "med_rosuvast", genericName: "Rosuvastatin", brandNames: ["Rosuvas", "Rozucor"], category: "statin", form: "Tablet", strengths: ["5 mg", "10 mg", "20 mg"], typicalFrequencies: ["0-1-0"], maxDailyDoseMg: 40 },
  { id: "med_aspirin", genericName: "Aspirin (Low dose)", brandNames: ["Ecosprin", "Loprin"], category: "antiplatelet", form: "Tablet", strengths: ["75 mg", "150 mg"], typicalFrequencies: ["1-0-0"], maxDailyDoseMg: 150, packageNote: "Take after food. Report any bleeding." },
  { id: "med_clopid", genericName: "Clopidogrel", brandNames: ["Deplatt", "Clopivas"], category: "antiplatelet", form: "Tablet", strengths: ["75 mg"], typicalFrequencies: ["1-0-0"], maxDailyDoseMg: 75, packageNote: "Report unusual bleeding." },
  { id: "med_cetirizine", genericName: "Cetirizine", brandNames: ["Cetzine", "Alerid"], category: "antihistamine", form: "Tablet", strengths: ["5 mg", "10 mg"], typicalFrequencies: ["0-1-0"], maxDailyDoseMg: 10, packageNote: "May cause drowsiness." },
  { id: "med_levo", genericName: "Levocetirizine", brandNames: ["Levocet", "L-Cet"], category: "antihistamine", form: "Tablet", strengths: ["5 mg"], typicalFrequencies: ["0-1-0"], maxDailyDoseMg: 5 },
  { id: "med_panto", genericName: "Pantoprazole", brandNames: ["Pan-D", "Panto"], category: "gastro", form: "Tablet", strengths: ["20 mg", "40 mg"], typicalFrequencies: ["1-0-0"], maxDailyDoseMg: 80, route: "Oral before breakfast" },
  { id: "med_omep", genericName: "Omeprazole", brandNames: ["Omez", "Ocid"], category: "gastro", form: "Capsule", strengths: ["10 mg", "20 mg"], typicalFrequencies: ["1-0-0"], maxDailyDoseMg: 40 },
  { id: "med_domper", genericName: "Domperidone", brandNames: ["Domstal", "Domidon"], category: "gastro", form: "Tablet", strengths: ["10 mg"], typicalFrequencies: ["1-0-1"], maxDailyDoseMg: 30 },
  { id: "med_raniti", genericName: "Ranitidine", brandNames: ["Rantac", "Acitak"], category: "gastro", form: "Tablet", strengths: ["150 mg", "300 mg"], typicalFrequencies: ["1-0-1"], maxDailyDoseMg: 600 },
  { id: "med_salbut", genericName: "Salbutamol", brandNames: ["Asthalin", "Ventorlin"], category: "bronchodilator", form: "Inhaler", strengths: ["100 mcg"], typicalFrequencies: ["As needed", "1-0-1"], packageNote: "Use with spacer if prescribed." },
  { id: "med_ambroxol", genericName: "Ambroxol", brandNames: ["Lazee", "Mucolite"], category: "cough_cold", form: "Syrup", strengths: ["30 mg/5ml"], typicalFrequencies: ["1-1-1"] },
  { id: "med_dextro", genericName: "Dextromethorphan", brandNames: ["Benadryl", "Cosaryl"], category: "cough_cold", form: "Syrup", strengths: ["10 mg/5ml"], typicalFrequencies: ["1-1-1"] },
];

const interactionGroups: Array<{ group: string[]; message: string }> = [
  { group: ["med_aspirin", "med_clopid"], message: "Dual antiplatelet with Aspirin + Clopidogrel raises bleeding risk. Confirm clinical need and review dose." },
  { group: ["med_aspirin", "med_ibu"], message: "Ibuprofen may reduce the antiplatelet effect of low-dose Aspirin and increases GI bleeding risk." },
  { group: ["med_amox", "med_metro"], message: "Metronidazole with Amoxicillin is generally safe before alcohol; avoid alcohol during the course." },
];

function activeMedicines(): Medicine[] {
  return medicines.filter((m) => m.id !== "med_ornidazole");
}

export function medicineById(id: string): Medicine | undefined {
  return activeMedicines().find((m) => m.id === id);
}

export function matchesQuery(medicine: Medicine, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (medicine.genericName.toLowerCase().includes(q)) return true;
  return medicine.brandNames.some((brand) => brand.toLowerCase().includes(q));
}

export function parseDoseMagnitude(dosage: string): number | undefined {
  const match = dosage.match(/(\d+(?:\.\d+)?)\s*(mg|g|mcg|ml)/i);
  if (!match) return undefined;
  const value = Number.parseFloat(match[1]);
  const unit = match[2].toLowerCase();
  if (unit === "g") return value * 1000;
  if (unit === "mcg") return value / 1000;
  return value;
}

const INTERACTION_MIN_IDS = 2;

const medicineService = {
  async search(query: string): Promise<Medicine[]> {
    await delay();
    return activeMedicines().filter((m) => matchesQuery(m, query)).slice(0, 25);
  },

  async listAll(): Promise<Medicine[]> {
    await delay();
    return activeMedicines();
  },

  async safetyCheck(allergies: string[], doses: MedicineDose[]): Promise<SafetyWarning[]> {
    await delay();
    const warnings: SafetyWarning[] = [];
    const loweredAllergies = allergies.map((a) => a.toLowerCase());

    for (const dose of doses) {
      const med = medicineById(dose.medicineId);
      if (!med) continue;

      if (med.allergyGroup === "penicillin" && loweredAllergies.some((a) => a.includes("penicillin"))) {
        warnings.push({
          kind: "allergy",
          severity: "danger",
          message: `${med.genericName} belongs to the penicillin group and ${
            loweredAllergies.find((a) => a.includes("penicillin")) ?? "penicillin"
          } is a documented allergy for this patient. Confirm before prescribing.`,
          medicineIds: [med.id],
        });
      }
      if (med.allergyGroup === "sulfa" && loweredAllergies.some((a) => a.includes("sulfa"))) {
        warnings.push({
          kind: "allergy",
          severity: "danger",
          message: `${med.genericName} is a sulfa drug and the patient has a documented sulfa allergy.`,
          medicineIds: [med.id],
        });
      }

      if (med.maxDailyDoseMg && dose.dailyDoseMg) {
        if (dose.dailyDoseMg > med.maxDailyDoseMg) {
          warnings.push({
            kind: "max_dose",
            severity: "warning",
            message: `${med.genericName} daily dose (${dose.dailyDoseMg} mg) exceeds the typical daily maximum (${med.maxDailyDoseMg} mg).`,
            medicineIds: [med.id],
          });
        }
      }
    }

    if (doses.length >= INTERACTION_MIN_IDS) {
      for (const pair of interactionGroups) {
        const present = pair.group.filter((id) => doses.some((d) => d.medicineId === id));
        if (pair.group.length === 2 && present.length === 2) {
          warnings.push({
            kind: "interaction",
            severity: "warning",
            message: pair.message,
            medicineIds: present,
          });
        } else if (pair.group.length > 2 && present.length >= 2) {
          warnings.push({
            kind: "interaction",
            severity: "warning",
            message: pair.message,
            medicineIds: present,
          });
        }
      }
    }

    return warnings;
  },
};

export { medicineService };