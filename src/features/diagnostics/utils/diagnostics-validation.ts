import type {
  CatalogParameter,
  DiagnosticOrderItem,
  ResultValue,
  TestCatalogItem,
} from "@/services/diagnostics/types";

export function validateOrderItems(
  items: DiagnosticOrderItem[]
): { valid: boolean; error: string | null } {
  if (items.length === 0) {
    return { valid: false, error: "Add at least one test to the order." };
  }
  return { valid: true, error: null };
}

export function emptyValuesFor(test: TestCatalogItem): ResultValue[] {
  return test.parameters.map((parameter) => ({
    parameterKey: parameter.key,
    name: parameter.name,
    unit: parameter.unit,
    refText: parameter.refText,
    refLow: parameter.refLow,
    refHigh: parameter.refHigh,
    value: "",
    flag: null,
  }));
}

export function validateResultValues(
  values: ResultValue[],
  parameters: CatalogParameter[]
): { valid: boolean; missing: string[] } {
  const empty: string[] = [];
  for (const parameter of parameters) {
    const value = values.find((v) => v.parameterKey === parameter.key)?.value ?? "";
    if (!value.trim()) {
      empty.push(parameter.name);
      continue;
    }
    if (parameter.numeric && Number.isNaN(Number.parseFloat(value))) {
      empty.push(parameter.name);
    }
  }
  return { valid: empty.length === 0, missing: empty };
}