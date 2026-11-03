import { useEffect, useState } from "react";

export type ConnectionStatus = "connecting" | "live" | "disconnected";

// Relative on purpose, like the fetch urls: resolves against the page, and
// Vite proxies /ws to the dev backend (see vite.config.js). Only the scheme
// changes, because a WebSocket url starts with ws: or wss:, not http:.
function socketUrl(): string {
  const url = new URL("ws", window.location.href);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  return url.href;
}

function logSocketEvent(eventName: string, detail?: unknown): void {
  console.info(`[live] ${eventName}`, detail ?? "");
}

export interface WorkspaceSocket {
  status: ConnectionStatus;
  lastReply: string | null;
}

// Demo 2: the smallest complete lifecycle. Connect, send one message when the
// connection opens, show the one reply, report the status, and close the
// connection when the component goes away.
export function useWorkspaceSocket(): WorkspaceSocket {
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [lastReply, setLastReply] = useState<string | null>(null);

  useEffect(() => {
    const socket = new WebSocket(socketUrl());
    // StrictMode mounts, cleans up and mounts again: the first socket's late
    // "close" must not overwrite the status of the second one.
    let isCurrent = true;
    socket.addEventListener("open", () => {
      logSocketEvent("open");
      if (isCurrent) setStatus("live");
      socket.send("Hello from the Workspace");
    });
    socket.addEventListener("message", (event: MessageEvent<string>) => {
      logSocketEvent("message", event.data);
      if (isCurrent) setLastReply(event.data);
    });
    socket.addEventListener("error", (event) => logSocketEvent("error", event));
    socket.addEventListener("close", (event) => {
      logSocketEvent("close", { code: event.code, reason: event.reason, wasClean: event.wasClean });
      if (isCurrent) setStatus("disconnected");
    });
    // Without this the connection would outlive the page that opened it.
    return () => {
      isCurrent = false;
      socket.close(1000, "Workspace closed");
    };
  }, []);

  return { status, lastReply };
}
