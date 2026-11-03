import type { Server } from "node:http";
import { WebSocketServer, type WebSocket } from "ws";
import { createDisplayName } from "./displayName.ts";

// Exercise 7: the WebSocket side of the dev backend. It shares the HTTP
// server (and so the port) of the REST API: a WebSocket starts life as an HTTP
// request with "Connection: Upgrade", and `ws` answers that upgrade on /ws.

export const SOCKET_PATH = "/ws";

export type LogLine = (line: string) => void;

export function attachRealtime(httpServer: Server, log: LogLine): WebSocketServer {
  const socketServer = new WebSocketServer({ server: httpServer, path: SOCKET_PATH });
  // The server is the authoritative list of who is connected: one entry per open socket.
  const namesBySocket = new Map<WebSocket, string>();

  function broadcastPresence(): void {
    const message = JSON.stringify({
      type: "presence-updated",
      names: [...namesBySocket.values()],
    });
    for (const socket of namesBySocket.keys()) socket.send(message);
  }

  socketServer.on("connection", (socket) => {
    const name = createDisplayName(new Set(namesBySocket.values()));
    namesBySocket.set(socket, name);
    log(`[realtime] open: ${name}`);
    socket.send(JSON.stringify({ type: "welcome", name }));
    broadcastPresence();

    socket.on("message", (data) => log(`[realtime] message from ${name}: ${data.toString()}`));
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
