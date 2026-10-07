import { WSEvent } from "@/app/types/session";

type EventHandler = (event: WSEvent) => void;
type ReconnectHandler = () => void;
type ConnectionHandler = (connected: boolean) => void;

export class SessionWebSocket {
  private ws: WebSocket | null = null;
  private url: string;
  private eventHandlers: Set<EventHandler> = new Set();
  private reconnectHandlers: Set<ReconnectHandler> = new Set();
  private connectionHandlers: Set<ConnectionHandler> = new Set();
  // One-shot resolvers parked by waitUntilOpen(), released on the next open.
  private openWaiters: Set<(opened: boolean) => void> = new Set();

  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private isIntentionallyClosed = false;
  private sessionId: string;
  private token: string;

  constructor(sessionId: string, token: string) {
    this.sessionId = sessionId;
    this.token = token;
    
    const baseUrl = process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:8080";
    const wsProtocol = baseUrl.startsWith("https") ? "wss:" : "ws:";
    const hostAndPath = baseUrl.replace(/^https?:\/\//, "");
    
    // Connect to root WS as per API docs
    this.url = `${wsProtocol}//${hostAndPath}/?sessionId=${sessionId}&token=${token}`;
  }

  public connect() {
    this.isIntentionallyClosed = false;
    this.setupConnection();
  }

  private setupConnection() {
    if (this.ws) {
      this.ws.close();
    }

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log(`WebSocket connected for session ${this.sessionId}`);
        this.reconnectAttempts = 0;

        // Release anyone awaiting the connection (see waitUntilOpen).
        this.openWaiters.forEach((resolve) => resolve(true));
        this.openWaiters.clear();

        this.connectionHandlers.forEach((handler) => handler(true));

        // Notify listeners that a reconnect happened, they should refetch GET /sessions/:id
        this.reconnectHandlers.forEach((handler) => handler());
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as WSEvent;
          this.eventHandlers.forEach((handler) => handler(data));
        } catch (e) {
          console.error("Failed to parse WebSocket message:", e);
        }
      };

      this.ws.onclose = () => {
        this.connectionHandlers.forEach((handler) => handler(false));

        if (!this.isIntentionallyClosed) {
          this.handleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
    } catch (e) {
      console.error("WebSocket setup failed:", e);
      this.handleReconnect();
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("WebSocket max reconnect attempts reached — giving up");

      // Nothing is coming. Release any waiters so callers stop blocking on us and
      // fall back to polling GET /sessions/:id (§6.2).
      this.openWaiters.forEach((resolve) => resolve(false));
      this.openWaiters.clear();
      return;
    }

    // Exponential backoff: 1s, 2s, 4s, 8s, 16s... cap at 30s
    const backoffMs = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;

    console.log(`WebSocket reconnecting in ${backoffMs}ms (attempt ${this.reconnectAttempts})`);
    
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
    }
    
    this.reconnectTimeoutId = setTimeout(() => {
      this.setupConnection();
    }, backoffMs);
  }

  public onMessage(handler: EventHandler) {
    this.eventHandlers.add(handler);
    return () => this.eventHandlers.delete(handler);
  }

  public onReconnect(handler: ReconnectHandler) {
    this.reconnectHandlers.add(handler);
    return () => this.reconnectHandlers.delete(handler);
  }

  /** Fires `true` on every open and `false` on every close. */
  public onConnectionChange(handler: ConnectionHandler) {
    this.connectionHandlers.add(handler);
    return () => this.connectionHandlers.delete(handler);
  }

  public isOpen(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Resolves `true` once the socket is open, or `false` if it hasn't opened within
   * `timeoutMs` (or has given up reconnecting entirely).
   *
   * This exists so generation can wait for the socket before starting: pages without a
   * face finish in 1–2 seconds and their events are never replayed (§13.8), so firing
   * /generate on a still-connecting socket loses them outright.
   *
   * The timeout is deliberate — a socket that will not open must never block generation.
   * A `false` result is not fatal, it just means the caller should rely on polling.
   */
  public waitUntilOpen(timeoutMs = 3000): Promise<boolean> {
    if (this.isOpen()) return Promise.resolve(true);

    return new Promise<boolean>((resolve) => {
      const settle = (opened: boolean) => {
        clearTimeout(timer);
        this.openWaiters.delete(settle);
        resolve(opened);
      };

      const timer = setTimeout(() => settle(false), timeoutMs);
      this.openWaiters.add(settle);
    });
  }

  public close() {
    this.isIntentionallyClosed = true;

    // Don't leave callers awaiting a socket that is never coming back.
    this.openWaiters.forEach((resolve) => resolve(false));
    this.openWaiters.clear();

    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
