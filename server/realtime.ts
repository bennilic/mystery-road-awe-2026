import type { Server } from "node:http";
import { WebSocketServer } from "ws";
import type { ClientMessage } from "../protocol/workspaceProtocol.ts";
import { WorkspaceSession } from "./workspaceSession.ts";

// Exercise 7: the WebSocket side of the dev backend. It shares the HTTP
// server (and so the port) of the REST API: a WebSocket starts life as an HTTP
// request with "Connection: Upgrade", and `ws` answers that upgrade on /ws.

export const SOCKET_PATH = "/ws";

export type LogLine = (line: string) => void;

// A compile error here means a ClientMessage type exists that no case handles.
function assertNever(message: never): never {
  throw new Error(`Unhandled message: ${JSON.stringify(message)}`);
}

export function attachRealtime(httpServer: Server, log: LogLine): WebSocketServer {
  const socketServer = new WebSocketServer({ server: httpServer, path: SOCKET_PATH });
  // The server is the authoritative state: one session, held in memory only.
  const session = new WorkspaceSession();

  socketServer.on("connection", (socket) => {
    const name = session.join(socket);
    log(`[realtime] open: ${name}`);
    session.send(socket, { type: "welcome", name });
    session.send(socket, { type: "workspace-state", bookmarks: session.bookmarks });
    session.broadcast({ type: "presence-updated", names: session.names });

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
          // Applying the toggle and broadcasting it arrives in Demo 6.
          break;
        case "request-state":
          session.send(socket, { type: "workspace-state", bookmarks: session.bookmarks });
          break;
        default:
          assertNever(message);
      }
    });
    socket.on("close", (code, reason) => {
      // Removing the entry on close is what keeps presence honest.
      session.leave(socket);
      log(`[realtime] close: ${name} (code ${code}, reason "${reason.toString()}")`);
      session.broadcast({ type: "presence-updated", names: session.names });
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
