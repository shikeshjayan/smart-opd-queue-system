import type { IntegrationProviderId } from "./types";

type StoredSecret = {
  name: string;
  provider: IntegrationProviderId;
  value: string;
};

const secrets = new Map<string, StoredSecret>();

export function getSecret(name: string): string | undefined {
  return secrets.get(name)?.value;
}

export function setSecret(name: string, provider: IntegrationProviderId, value: string): void {
  secrets.set(name, { name, provider, value });
}

export function maskSecret(value: string): string {
  if (value.length <= 6) return "••••••";
  return `${value.slice(0, 3)}${"•".repeat(Math.max(0, value.length - 6))}${value.slice(-3)}`;
}

export function hasSecret(name: string): boolean {
  return secrets.has(name);
}

export function listSecrets(): Array<{ name: string; provider: IntegrationProviderId; masked: string }> {
  return Array.from(secrets.values()).map((s) => ({
    name: s.name,
    provider: s.provider,
    masked: maskSecret(s.value),
  }));
}
