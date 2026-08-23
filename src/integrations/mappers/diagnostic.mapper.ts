import type { DataMapper } from "../types";

export const diagnosticOrderMapper: DataMapper = {
  providerId: "laboratory",
  entityType: "diagnostic_order",
  mappings: [
    { internal: "id", external: "order_id", transform: "none" },
    { internal: "patientId", external: "patient_identifier", transform: "none" },
    { internal: "doctorId", external: "ordering_practitioner", transform: "none" },
    { internal: "hospitalId", external: "facility_id", transform: "none" },
    { internal: "items", external: "test_items", transform: "none" },
    { internal: "orderedAt", external: "order_date", transform: "date_iso" },
  ],
};

export const diagnosticResultMapper: DataMapper = {
  providerId: "laboratory",
  entityType: "diagnostic_result",
  mappings: [
    { internal: "id", external: "result_id", transform: "none" },
    { internal: "orderId", external: "order_id", transform: "none" },
    { internal: "testId", external: "test_code", transform: "none" },
    { internal: "values", external: "result_values", transform: "none" },
    { internal: "finalizedAt", external: "finalized_date", transform: "date_iso" },
  ],
};

export type ExternalDiagnosticOrder = {
  order_id: string;
  patient_identifier: string;
  ordering_practitioner: string;
  facility_id: string;
  order_date: string;
  test_items: Array<{
    test_code: string;
    test_name: string;
    category: string;
    priority: string;
  }>;
};

export type ExternalDiagnosticResult = {
  result_id: string;
  order_id: string;
  test_code: string;
  result_values: Array<{
    parameter: string;
    value: string;
    unit?: string;
    flag?: string;
  }>;
  finalized_date: string;
};

export function mapDiagnosticOrderToExternal(order: {
  id: string;
  patientId: string;
  doctorId: string;
  hospitalId: string;
  orderedAt: string;
  items: Array<{ testId: string; testName: string; category: string; priority: string }>;
}): ExternalDiagnosticOrder {
  return {
    order_id: order.id,
    patient_identifier: order.patientId,
    ordering_practitioner: order.doctorId,
    facility_id: order.hospitalId,
    order_date: order.orderedAt,
    test_items: order.items.map((item) => ({
      test_code: item.testId,
      test_name: item.testName,
      category: item.category,
      priority: item.priority,
    })),
  };
}

export function mapDiagnosticResultToExternal(result: {
  id: string;
  orderId: string;
  testId: string;
  finalizedAt: string;
  values: Array<{ name: string; value: string; unit?: string; flag?: string | null }>;
}): ExternalDiagnosticResult {
  return {
    result_id: result.id,
    order_id: result.orderId,
    test_code: result.testId,
    result_values: result.values.map((v) => ({
      parameter: v.name,
      value: v.value,
      unit: v.unit,
      flag: v.flag ?? undefined,
    })),
    finalized_date: result.finalizedAt,
  };
}
