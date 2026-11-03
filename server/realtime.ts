import type { Server } from "node:http";
import { WebSocketServer, type WebSocket } from "ws";
import type { ClientMessage, ServerMessage } from "../protocol/workspaceProtocol.ts";
import { createDisplayName } from "./displayName.ts";

// Exercise 7: the WebSocket side of the dev backend. It shares the HTTP
// server (and so the port) of the REST API: a WebSocket starts life as an HTTP
// request with "Connection: Upgrade", and `ws` answers that upgrade on /ws.

export const SOCKET_PATH = "/ws";

export type LogLine = (line: string) => void;

function sendMessage(socket: WebSocket, message: ServerMessage): void {
  socket.send(JSON.stringify(message));
}

// A compile error here means a ClientMessage type exists that no case handles.
function assertNever(message: never): never {
  throw new Error(`Unhandled message: ${JSON.stringify(message)}`);
}

export function attachRealtime(httpServer: Server, log: LogLine): WebSocketServer {
  const socketServer = new WebSocketServer({ server: httpServer, path: SOCKET_PATH });
  // The server is the authoritative list of who is connected: one entry per open socket.
  const namesBySocket = new Map<WebSocket, string>();

  function broadcastPresence(): void {
    const message: ServerMessage = {
      type: "presence-updated",
      names: [...namesBySocket.values()],
    };
    for (const socket of namesBySocket.keys()) sendMessage(socket, message);
  }

  socketServer.on("connection", (socket) => {
    const name = createDisplayName(new Set(namesBySocket.values()));
    namesBySocket.set(socket, name);
    log(`[realtime] open: ${name}`);
    sendMessage(socket, { type: "welcome", name });
    broadcastPresence();

    socket.on("message", (data) => {
      let message: ClientMessage;
      try {
        // A cast, not a check: Demo 9 adds the real validation. Until then a
        // broken frame is only kept from crashing the server.
        message = JSON.parse(data.toString()) as ClientMessage;
      } catch (error) {
        log(`[realtime] ignored unreadable message from ${name}: ${String(error)}`);
        return;
      }
      log(`[realtime] message from ${name}: ${message.type}`);
      switch (message.type) {
        case "toggle-bookmark":
        case "request-state":
          // Shared bookmark state arrives in Demos 5 and 6.
          break;
        default:
          assertNever(message);
      }
    });
    socket.on("close", (code, reason) => {
      // Removing the entry on close is what keeps presence honest.
      namesBySocket.delete(socket);
      log(`[realtime] close: ${name} (code ${code}, reason "${reason.toString()}")`);
      broadcastPresence();
    });
    socket.on("error", (error) => log(`[realtime] error: ${name}: ${error.message}`));
  });

  // http.Server.close() waits for open connections; upgraded sockets would keep
  // it from ever finishing, so closing the server also ends them.
  httpServer.on("close", () => {
    for (const socket of socketServer.clients) socket.terminate();
    socketServer.close();
  });
  return socketServer;
}
