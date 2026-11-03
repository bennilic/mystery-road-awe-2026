export type ConnectionStatus = "connecting" | "live" | "reconnecting" | "disconnected";

export interface ReconnectingSocketOptions {
  url: string;
  // How long to wait before the one automatic retry after a loss.
  retryDelayMs: number;
  onStatusChange: (status: ConnectionStatus, problem: string | null) => void;
  onMessage: (text: string) => void;
  // isReconnect is true when this open follows a loss: the caller must then
  // ask for the current state, because messages sent meanwhile were missed.
  onOpen: (isReconnect: boolean) => void;
  log?: (eventName: string, detail?: unknown) => void;
}

// A WebSocket that tells its owner the status, and after a loss tries to
// connect exactly once more (no loop, no backoff: that is an extension).
// Plain TypeScript with no React, so it can be tested with Node's WebSocket.
export class ReconnectingSocket {
  private socket: WebSocket | null = null;
  private retryTimer: ReturnType<typeof setTimeout> | undefined;
  private hasRetried = false;
  private isStopped = false;

  private readonly options: ReconnectingSocketOptions;

  // An explicit field, not a constructor parameter property: Node's type
  // stripping (used by `npm test`) cannot erase parameter properties.
  constructor(options: ReconnectingSocketOptions) {
    this.options = options;
  }

  start(): void {
    this.connect(false);
  }

  /** Returns false (and sends nothing) when the connection is not open. */
  send(text: string): boolean {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return false;
    this.socket.send(text);
    return true;
  }

  /** Manual retry, for the user once the automatic one has failed. */
  retryNow(): void {
    if (this.isStopped) return;
    clearTimeout(this.retryTimer);
    this.hasRetried = true; // a failure of this attempt ends in "disconnected", not another retry
    this.options.onStatusChange("reconnecting", null);
    this.connect(true);
  }

  /** Deliberate close: no status change and no retry follow. */
  stop(): void {
    this.isStopped = true;
    clearTimeout(this.retryTimer);
    this.socket?.close(1000, "Workspace closed");
  }

  private connect(isReconnect: boolean): void {
    const socket = new WebSocket(this.options.url);
    this.socket = socket;
    const log = this.options.log ?? (() => {});
    // Events of a socket that is no longer the current one (or after stop())
    // are logged but must not change the status.
    const isCurrent = () => !this.isStopped && this.socket === socket;

    socket.addEventListener("open", () => {
      log("open");
      if (!isCurrent()) return;
      this.hasRetried = false;
      this.options.onStatusChange("live", null);
      this.options.onOpen(isReconnect);
    });
    socket.addEventListener("message", (event: MessageEvent<string>) => {
      log("message", event.data);
      if (isCurrent()) this.options.onMessage(event.data);
    });
    socket.addEventListener("error", (event) => log("error", event));
    socket.addEventListener("close", (event) => {
      log("close", { code: event.code, reason: event.reason, wasClean: event.wasClean });
      if (isCurrent()) this.handleLoss(event.code);
    });
  }

  private handleLoss(closeCode: number): void {
    const problem = `The connection closed (code ${closeCode}).`;
    if (this.hasRetried) {
      this.options.onStatusChange("disconnected", problem);
      return;
    }
    this.hasRetried = true;
    this.options.onStatusChange("reconnecting", problem);
    this.retryTimer = setTimeout(() => this.connect(true), this.options.retryDelayMs);
  }
}
