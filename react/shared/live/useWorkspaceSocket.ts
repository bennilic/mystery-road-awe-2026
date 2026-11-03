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

// Hand-written checks for now; Demo 4 replaces them with one shared message type.
function isWelcome(message: unknown): message is { type: "welcome"; name: string } {
  return (
    typeof message === "object" &&
    message !== null &&
    "type" in message &&
    message.type === "welcome" &&
    "name" in message &&
    typeof message.name === "string"
  );
}

function isPresenceUpdate(
  message: unknown,
): message is { type: "presence-updated"; names: string[] } {
  return (
    typeof message === "object" &&
    message !== null &&
    "type" in message &&
    message.type === "presence-updated" &&
    "names" in message &&
    Array.isArray(message.names)
  );
}

export interface WorkspaceSocket {
  status: ConnectionStatus;
  // The name the server gave this connection; null until the welcome arrives.
  myName: string | null;
  // Everyone currently connected, as last reported by the server.
  presenceNames: string[];
}

// Connects, reports the status, keeps the server's name for this connection and
// its presence list, and closes the connection when the component goes away.
export function useWorkspaceSocket(): WorkspaceSocket {
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [myName, setMyName] = useState<string | null>(null);
  const [presenceNames, setPresenceNames] = useState<string[]>([]);

  useEffect(() => {
    const socket = new WebSocket(socketUrl());
    // StrictMode mounts, cleans up and mounts again: the first socket's late
    // "close" must not overwrite the status of the second one.
    let isCurrent = true;
    socket.addEventListener("open", () => {
      logSocketEvent("open");
      if (isCurrent) setStatus("live");
    });
    socket.addEventListener("message", (event: MessageEvent<string>) => {
      logSocketEvent("message", event.data);
      if (!isCurrent) return;
      const message: unknown = JSON.parse(event.data);
      if (isWelcome(message)) setMyName(message.name);
      else if (isPresenceUpdate(message)) setPresenceNames(message.names);
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

  return { status, myName, presenceNames };
}
