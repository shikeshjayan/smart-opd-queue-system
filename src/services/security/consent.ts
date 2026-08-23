import type { ConsentStatus } from "@/types/security.types";

const CONSENT_KEY = "sh.security.consents";
const HISTORY_KEY = "sh.security.consentHistory";

export type ConsentRecord = {
  id: string;
  patientId: string;
  purpose: string;
  status: ConsentStatus;
  grantedAt: string;
  expiresAt?: string;
  grantedBy: string;
  requestedBy?: string;
  scopeNote?: string;
};

export type ConsentHistoryEntry = {
  id: string;
  consentId: string;
  patientId: string;
  status: ConsentStatus;
  changedAt: string;
  changedBy: string;
  note?: string;
};

export function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
}

function seedConsents(): ConsentRecord[] {
  const day = 86_400_000;
  const now = Date.now();
  return [
    {
      id: "con_001",
      patientId: "P10294",
      purpose: "Clinical care",
      status: "granted",
      grantedAt: new Date(now - 30 * day).toISOString(),
      grantedBy: "P10294",
      scopeNote: "Treating clinicians at Government Hospital Ernakulam",
    },
    {
      id: "con_002",
      patientId: "P10294",
      purpose: "Diagnostic result sharing",
      status: "granted",
      grantedAt: new Date(now - 20 * day).toISOString(),
      expiresAt: new Date(now + 10 * day).toISOString(),
      grantedBy: "P10294",
      requestedBy: "lab_001",
      scopeNote: "Laboratory staff of the ordering hospital",
    },
    {
      id: "con_003",
      patientId: "P10294",
      purpose: "Medical document access by referring hospital",
      status: "withdrawn",
      grantedAt: new Date(now - 15 * day).toISOString(),
      grantedBy: "P10294",
      requestedBy: "doc_005",
      scopeNote: "Government Hospital Aluva — referral review",
    },
  ];
}

function seedHistory(consents: ConsentRecord[]): ConsentHistoryEntry[] {
  const entries: ConsentHistoryEntry[] = [];
  consents.forEach((consent, index) => {
    entries.push({
      id: `ch_${index}a`,
      consentId: consent.id,
      patientId: consent.patientId,
      status: "granted",
      changedAt: consent.grantedAt,
      changedBy: consent.grantedBy,
    });
    if (consent.status === "withdrawn") {
      entries.push({
        id: `ch_${index}b`,
        consentId: consent.id,
        patientId: consent.patientId,
        status: "withdrawn",
        changedAt: new Date(new Date(consent.grantedAt).getTime() + 3 * 86_400_000).toISOString(),
        changedBy: consent.patientId,
        note: "Patient withdrew access from privacy settings",
      });
    }
  });
  return entries.sort((a, b) => b.changedAt.localeCompare(a.changedAt));
}

let consentStore: ConsentRecord[] | null = null;
let historyStore: ConsentHistoryEntry[] | null = null;

function ensureLoaded(): { consents: ConsentRecord[]; history: ConsentHistoryEntry[] } {
  if (consentStore && historyStore) return { consents: consentStore, history: historyStore };
  const storedConsents = read<ConsentRecord[]>(CONSENT_KEY, []);
  if (storedConsents.length > 0) {
    consentStore = storedConsents;
    historyStore = read<ConsentHistoryEntry[]>(HISTORY_KEY, []);
  } else {
    consentStore = seedConsents();
    historyStore = seedHistory(consentStore);
    write(CONSENT_KEY, consentStore);
    write(HISTORY_KEY, historyStore);
  }
  return { consents: consentStore, history: historyStore };
}

function persist(): void {
  if (consentStore) write(CONSENT_KEY, consentStore);
  if (historyStore) write(HISTORY_KEY, historyStore);
}

function isEffective(record: ConsentRecord, at: Date = new Date()): boolean {
  if (record.status !== "granted") return false;
  if (record.expiresAt && new Date(record.expiresAt).getTime() <= at.getTime()) return false;
  return true;
}

export type GrantInput = {
  patientId: string;
  purpose: string;
  grantedBy: string;
  requestedBy?: string;
  durationDays?: number;
  scopeNote?: string;
};

export const consentService = {
  listForPatient(patientId: string): ConsentRecord[] {
    return ensureLoaded()
      .consents.filter((c) => c.patientId === patientId)
      .sort((a, b) => b.grantedAt.localeCompare(a.grantedAt));
  },

  historyForPatient(patientId: string): ConsentHistoryEntry[] {
    return ensureLoaded()
      .history.filter((h) => h.patientId === patientId)
      .sort((a, b) => b.changedAt.localeCompare(a.changedAt));
  },

  hasEffectiveConsent(patientId: string, purpose: string): boolean {
    return ensureLoaded().consents.some(
      (c) => c.patientId === patientId && c.purpose === purpose && isEffective(c)
    );
  },

  grant(input: GrantInput): ConsentRecord {
    const { consents, history } = ensureLoaded();
    const existing = consents.find((c) => c.patientId === input.patientId && c.purpose === input.purpose);
    const nowIso = new Date().toISOString();

    if (!existing) {
      const record: ConsentRecord = {
        id: `con_${Date.now()}`,
        patientId: input.patientId,
        purpose: input.purpose,
        status: "granted",
        grantedAt: nowIso,
        grantedBy: input.grantedBy,
        ...(input.requestedBy ? { requestedBy: input.requestedBy } : {}),
        ...(input.scopeNote ? { scopeNote: input.scopeNote } : {}),
        ...(input.durationDays
          ? { expiresAt: new Date(Date.now() + input.durationDays * 86_400_000).toISOString() }
          : {}),
      };
      consents.unshift(record);
      history.unshift({
        id: `ch_${Date.now()}`,
        consentId: record.id,
        patientId: record.patientId,
        status: "granted",
        changedAt: nowIso,
        changedBy: input.grantedBy,
        note: input.scopeNote,
      });
      persist();
      return record;
    }

    existing.status = "granted";
    existing.grantedAt = nowIso;
    existing.grantedBy = input.grantedBy;
    existing.expiresAt = input.durationDays
      ? new Date(Date.now() + input.durationDays * 86_400_000).toISOString()
      : undefined;
    if (input.scopeNote) existing.scopeNote = input.scopeNote;

    history.unshift({
      id: `ch_${Date.now()}`,
      consentId: existing.id,
      patientId: existing.patientId,
      status: "granted",
      changedAt: nowIso,
      changedBy: input.grantedBy,
      note: input.scopeNote,
    });
    persist();
    return existing;
  },

  withdraw(consentId: string, withdrawnBy: string, note?: string): ConsentRecord | undefined {
    const { consents, history } = ensureLoaded();
    const record = consents.find((c) => c.id === consentId);
    if (!record) return undefined;

    const nowIso = new Date().toISOString();
    record.status = "withdrawn";
    history.unshift({
      id: `ch_${Date.now()}`,
      consentId: record.id,
      patientId: record.patientId,
      status: "withdrawn",
      changedAt: nowIso,
      changedBy: withdrawnBy,
      note,
    });
    persist();
    return record;
  },
};
