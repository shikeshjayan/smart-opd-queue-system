import "server-only";

/**
 * Provider abstraction (§1). The notification provider remains replaceable:
 * add a new file implementing NotificationProvider and select it via env.
 */

export interface ProviderMessage {
  /** Rendered, localized body — already privacy-filtered (template-only). */
  title: string;
  body: string;
  recipientAddress?: string;
  deepLink?: string;
  /** Only operational metadata — never clinical content (§22). */
  meta: Record<string, string>;
}

export interface ProviderResult {
  state: "sent" | "delivered" | "failed";
  providerMessageId?: string;
  error?: string;
}

export interface NotificationProvider {
  readonly name: string;
  send(message: ProviderMessage): Promise<ProviderResult>;
}
