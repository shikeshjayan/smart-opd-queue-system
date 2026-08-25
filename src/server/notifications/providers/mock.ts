import "server-only";
import type {
  NotificationProvider,
  ProviderMessage,
  ProviderResult,
} from "./types";

/**
 * Mock providers (DoD: "Mock notification provider").
 *
 * Deterministic failure simulation for exercising retry/dead-letter paths:
 * set NOTIF_SIMULATE_FAILURE=1 AND target a recipient whose address ends in
 * "0000" (e.g. seed a patient phone +91XXXXXXXX00) — the send fails with a
 * provider-style error. Everything else succeeds. No randomness, so demos
 * and tests are reproducible.
 */

const SIMULATE_FAILURES = process.env.NOTIF_SIMULATE_FAILURE === "1";

function shouldFail(message: ProviderMessage): boolean {
  return (
    SIMULATE_FAILURES &&
    Boolean(message.recipientAddress) &&
    message.recipientAddress!.replace(/\D/g, "").endsWith("0000")
  );
}

function makeProvider(name: string, channel: string): NotificationProvider {
  return {
    name,
    async send(message: ProviderMessage): Promise<ProviderResult> {
      // In production this is where the real SDK call goes
      // (MSG91 / gupshup for SMS, FCM/Web-Push for push, SMTP/SES for email).
      if (shouldFail(message)) {
        return { state: "failed", error: `${channel} provider rejected recipient (simulated)` };
      }
      return {
        state: "sent",
        providerMessageId: `${channel}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      };
    },
  };
}

export const mockSmsProvider = makeProvider("mock-sms", "sms");
export const mockPushProvider = makeProvider("mock-push", "push");
export const mockEmailProvider = makeProvider("mock-email", "email");

/** Console fallback so an unconfigured channel never crashes the workflow. */
export const consoleProvider = (channel: string): NotificationProvider => ({
  name: `console-${channel}`,
  async send(message: ProviderMessage): Promise<ProviderResult> {
    console.log(`[notify:${channel}]`, message.title, "|", message.body.slice(0, 120));
    return { state: "sent", providerMessageId: `console_${Date.now().toString(36)}` };
  },
});
