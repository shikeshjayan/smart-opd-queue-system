import { integrationService } from "../service";
import { MockIdentityProvider } from "./identity";
import { MockHealthRecordProvider } from "./health-record";
import { MockLaboratoryProvider } from "./laboratory";
import { MockPharmacyProvider } from "./pharmacy";
import { MockNotificationProvider } from "./notification";
import { MockReportingProvider } from "./reporting";

let initialized = false;

export function initializeProviders(): void {
  if (initialized) return;
  integrationService.registerProvider(new MockIdentityProvider());
  integrationService.registerProvider(new MockHealthRecordProvider());
  integrationService.registerProvider(new MockLaboratoryProvider());
  integrationService.registerProvider(new MockPharmacyProvider());
  integrationService.registerProvider(new MockNotificationProvider());
  integrationService.registerProvider(new MockReportingProvider());
  initialized = true;
}
