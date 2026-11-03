import { useCallback, useEffect, useRef, useState } from "react";
import type { ClientMessage, ServerMessage } from "../../../protocol/workspaceProtocol.ts";

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
  // The name the server gave this connection; null until the welcome arrives.
  myName: string | null;
  // Everyone currently connected, as last reported by the server.
  presenceNames: string[];
  // The shared bookmark ids as last sent by the server.
  sharedBookmarkIds: string[];
  // Returns false (and sends nothing) when the connection is not open.
  sendMessage: (message: ClientMessage) => boolean;
}

// Connects, reports the status, keeps what the server last said (own name,
// presence, shared bookmarks), and closes the connection when the component
// goes away.
export function useWorkspaceSocket(): WorkspaceSocket {
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [myName, setMyName] = useState<string | null>(null);
  const [presenceNames, setPresenceNames] = useState<string[]>([]);
  const [sharedBookmarkIds, setSharedBookmarkIds] = useState<string[]>([]);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const socket = new WebSocket(socketUrl());
    socketRef.current = socket;
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
      const message = JSON.parse(event.data) as ServerMessage;
      switch (message.type) {
        case "welcome":
          setMyName(message.name);
          break;
        case "presence-updated":
          setPresenceNames(message.names);
          break;
        case "workspace-state":
        case "bookmarks-updated":
          setSharedBookmarkIds(message.bookmarks);
          break;
      }
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

  const sendMessage = useCallback((message: ClientMessage): boolean => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return false;
    socket.send(JSON.stringify(message));
    return true;
  }, []);

  return { status, myName, presenceNames, sharedBookmarkIds, sendMessage };
}
