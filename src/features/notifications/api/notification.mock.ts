import type {
  Notification,
  NotificationPreferences,
  QueueNotification,
} from "../types/notification.types";
import { DEFAULT_PREFERENCES } from "../types/notification.types";

const delay = () => new Promise((resolve) => setTimeout(resolve, 200));

function storageKey(patientId: string, suffix: string) {
  return `sh.notifications.${suffix}.${patientId}`;
}

function read<T>(key: string, fallback: T): T {
  if (typeof localStorage === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
}

export function seedNotifications(patientId: string): Notification[] {
  const now = new Date();
  const iso = (offsetMinutes: number) =>
    new Date(now.getTime() - offsetMinutes * 60_000).toISOString();

  return [
    {
      id: `n_${patientId}_001`,
      type: "queue",
      title: "Token called",
      message: "Token A-047 has been called. Please proceed to Cardiology — Room 04.",
      createdAt: iso(5),
      priority: "critical",
      tokenNumber: "A-047",
    } as QueueNotification,
    {
      id: `n_${patientId}_002`,
      type: "queue",
      title: "Your turn is approaching",
      message: "You are 3 patients ahead. Please stay nearby.",
      createdAt: iso(12),
      priority: "important",
      tokenNumber: "A-047",
    } as QueueNotification,
    {
      id: `n_${patientId}_003`,
      type: "appointment",
      title: "OPD schedule updated",
      message: "Cardiology Morning OPD schedule updated for tomorrow.",
      createdAt: iso(60 * 26),
    },
    {
      id: `n_${patientId}_004`,
      type: "system",
      title: "Welcome",
      message: "Your Smart Health OPD account is active.",
      createdAt: iso(60 * 24 * 3),
    },
    {
      id: `n_${patientId}_005`,
      type: "medical",
      title: "Lab report ready",
      message: "Your recent lab report is available to view.",
      createdAt: iso(60 * 24 * 5),
    },
  ];
}

export const notificationMockApi = {
  async list(patientId: string): Promise<Notification[]> {
    await delay();
    const stored = read<Notification[]>(storageKey(patientId, "list"), []);
    const seeded = read<boolean>(storageKey(patientId, "seeded"), false);
    if (!seeded && stored.length === 0) {
      const initial = seedNotifications(patientId);
      write(storageKey(patientId, "list"), initial);
      write(storageKey(patientId, "seeded"), true);
      return [...initial].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    return [...stored].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async unreadCount(patientId: string): Promise<number> {
    const all = await notificationMockApi.list(patientId);
    return all.filter((n) => !n.readAt).length;
  },

  async markRead(patientId: string, id: string): Promise<void> {
    const all = read<Notification[]>(storageKey(patientId, "list"), []);
    const index = all.findIndex((n) => n.id === id);
    if (index >= 0 && !all[index].readAt) {
      all[index] = { ...all[index], readAt: new Date().toISOString() };
      write(storageKey(patientId, "list"), all);
    }
  },

  async markAllRead(patientId: string): Promise<void> {
    const all = read<Notification[]>(storageKey(patientId, "list"), []);
    const now = new Date().toISOString();
    write(
      storageKey(patientId, "list"),
      all.map((n) => (n.readAt ? n : { ...n, readAt: now }))
    );
  },

  async add(patientId: string, notification: QueueNotification | Notification): Promise<void> {
    const all = read<Notification[]>(storageKey(patientId, "list"), []);
    if (all.some((n) => n.id === notification.id)) return;
    all.unshift(notification);
    write(storageKey(patientId, "list"), all);
  },

  async getPreferences(patientId: string): Promise<NotificationPreferences> {
    await delay();
    return read(storageKey(patientId, "prefs"), DEFAULT_PREFERENCES);
  },

  async savePreferences(patientId: string, preferences: NotificationPreferences): Promise<void> {
    await delay();
    write(storageKey(patientId, "prefs"), preferences);
  },
};
