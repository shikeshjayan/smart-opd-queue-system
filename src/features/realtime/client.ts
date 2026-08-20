import type {
  ConnectionStatus,
  RealtimeEvent,
  RealtimeListener,
} from "./types/realtime.types";
import { isQueueEventType } from "./events";

const CHANNEL_NAME = "smart-health-queue";
const RECONNECT_DELAY_MS = 3000;

type Subscription = {
  type: RealtimeEvent["type"] | "*";
  listener: RealtimeListener;
};

class RealtimeClient {
  private bus = new EventTarget();
  private channel: BroadcastChannel | null = null;
  private subscriptions = new Set<Subscription>();
  private statusListeners = new Set<() => void>();
  private _status: ConnectionStatus = "disconnected";
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  get status(): ConnectionStatus {
    return this._status;
  }

  connect() {
    if (this.channel === null && typeof BroadcastChannel !== "undefined") {
      try {
        this.channel = new BroadcastChannel(CHANNEL_NAME);
        this.channel.addEventListener("message", (raw) => {
          const event = (raw as MessageEvent<RealtimeEvent>).data;
          if (event && typeof event.type === "string") {
            this.dispatchLocal(event);
          }
        });
      } catch {
        this.channel = null;
      }
    }
    this.setStatus("connected");
  }

  disconnect() {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.channel?.close();
    this.channel = null;
    this.setStatus("disconnected");
  }

  simulateDisconnect() {
    if (this.reconnectTimer !== null) return;
    this.setStatus("reconnecting");
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.reconnect();
    }, RECONNECT_DELAY_MS);
  }

  reconnect() {
    if (this.channel === null) this.connect();
    else this.setStatus("connected");
  }

  emit(event: RealtimeEvent) {
    this.dispatchLocal(event);
    this.channel?.postMessage(event);
  }

  subscribe(type: RealtimeEvent["type"] | "*", listener: RealtimeListener) {
    const subscription: Subscription = { type, listener };
    this.subscriptions.add(subscription);
    return () => {
      this.subscriptions.delete(subscription);
    };
  }

  onStatusChange(listener: () => void) {
    this.statusListeners.add(listener);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  private dispatchLocal(event: RealtimeEvent) {
    const payload = new CustomEvent<RealtimeEvent>("realtime", { detail: event });
    this.bus.dispatchEvent(payload);
    for (const subscription of this.subscriptions) {
      if (
        subscription.type === "*" ||
        (subscription.type === "CONNECTION_CHANGED" && event.type === "CONNECTION_CHANGED") ||
        (isQueueEventType(subscription.type) && event.type === subscription.type)
      ) {
        subscription.listener(event);
      }
    }
  }

  private setStatus(status: ConnectionStatus) {
    if (this._status === status) return;
    this._status = status;
    this.emit({ type: "CONNECTION_CHANGED", status, at: new Date().toISOString() });
    this.statusListeners.forEach((listener) => listener());
  }
}

export const realtimeClient = new RealtimeClient();
