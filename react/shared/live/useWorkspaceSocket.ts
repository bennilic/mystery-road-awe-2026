import { useCallback, useEffect, useRef, useState } from "react";
import type { ClientMessage, ServerMessage } from "../../../protocol/workspaceProtocol.ts";
import { ReconnectingSocket, type ConnectionStatus } from "./ReconnectingSocket.ts";

export type { ConnectionStatus };

const RETRY_DELAY_MS = 2000;

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
  // Why the last connection ended; null while live.
  problem: string | null;
  // What the server last refused and why; null once a later update succeeded.
  serverError: string | null;
  // The name the server gave this connection; null until the welcome arrives.
  myName: string | null;
  // Everyone currently connected, as last reported by the server.
  presenceNames: string[];
  // The shared bookmark ids as last sent by the server. After a loss this is
  // the last KNOWN set, not necessarily the current one.
  sharedBookmarkIds: string[];
  // Returns false (and sends nothing) when the connection is not open.
  sendMessage: (message: ClientMessage) => boolean;
  // For the user, after the automatic retry has failed.
  reconnect: () => void;
}

// Connects, reports the status, keeps what the server last said (own name,
// presence, shared bookmarks), reconnects once after a loss and asks for the
// current state when it does, and closes the connection when the component
// goes away.
export function useWorkspaceSocket(): WorkspaceSocket {
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [problem, setProblem] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [myName, setMyName] = useState<string | null>(null);
  const [presenceNames, setPresenceNames] = useState<string[]>([]);
  const [sharedBookmarkIds, setSharedBookmarkIds] = useState<string[]>([]);
  const connectionRef = useRef<ReconnectingSocket | null>(null);

  useEffect(() => {
    const connection = new ReconnectingSocket({
      url: socketUrl(),
      retryDelayMs: RETRY_DELAY_MS,
      log: logSocketEvent,
      onStatusChange: (nextStatus, nextProblem) => {
        setStatus(nextStatus);
        setProblem(nextProblem);
      },
      onOpen: (isReconnect) => {
        // The server also sends the state to every new connection; asking
        // explicitly makes the reconnect correct even for a server that does not.
        if (isReconnect) {
          const request: ClientMessage = { type: "request-state" };
          connection.send(JSON.stringify(request));
        }
      },
      onMessage: (text) => {
        const message = JSON.parse(text) as ServerMessage;
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
            setServerError(null);
            break;
          case "error":
            setServerError(message.message);
            break;
        }
      },
    });
    connectionRef.current = connection;
    connection.start();
    // Without this the connection would outlive the page that opened it.
    return () => connection.stop();
  }, []);

  const sendMessage = useCallback((message: ClientMessage): boolean => {
    return connectionRef.current?.send(JSON.stringify(message)) ?? false;
  }, []);
  const reconnect = useCallback(() => connectionRef.current?.retryNow(), []);

  return {
    status,
    problem,
    serverError,
    myName,
    presenceNames,
    sharedBookmarkIds,
    sendMessage,
    reconnect,
  };
}
