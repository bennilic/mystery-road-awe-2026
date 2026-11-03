import type { Server } from "node:http";
import { WebSocketServer } from "ws";

// Exercise 7: the WebSocket side of the dev backend. It shares the HTTP
// server (and so the port) of the REST API: a WebSocket starts life as an HTTP
// request with "Connection: Upgrade", and `ws` answers that upgrade on /ws.

export const SOCKET_PATH = "/ws";

export type LogLine = (line: string) => void;

export function attachRealtime(httpServer: Server, log: LogLine): WebSocketServer {
  const socketServer = new WebSocketServer({ server: httpServer, path: SOCKET_PATH });

  socketServer.on("connection", (socket) => {
    log("[realtime] open");
    socket.on("message", (data) => {
      const text = data.toString();
      log(`[realtime] message: ${text}`);
      socket.send(`Server received: ${text}`);
    });
    socket.on("close", (code, reason) =>
      log(`[realtime] close (code ${code}, reason "${reason.toString()}")`),
    );
    socket.on("error", (error) => log(`[realtime] error: ${error.message}`));
  });

  // http.Server.close() waits for open connections; upgraded sockets would keep
  // it from ever finishing, so closing the server also ends them.
  httpServer.on("close", () => {
    for (const socket of socketServer.clients) socket.terminate();
    socketServer.close();
  });
  return socketServer;
}
