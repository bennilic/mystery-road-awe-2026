import type { Server } from "node:http";
import { WebSocketServer } from "ws";
import { validateClientMessage } from "./validateClientMessage.ts";
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

// The largest frame the server accepts; the largest real message is a few hundred bytes.
const MAX_MESSAGE_BYTES = 16 * 1024;

export function attachRealtime(
  httpServer: Server,
  log: LogLine,
  knownEvidenceIds: ReadonlySet<string>,
): WebSocketServer {
  const socketServer = new WebSocketServer({
    server: httpServer,
    path: SOCKET_PATH,
    maxPayload: MAX_MESSAGE_BYTES,
  });
  // The server is the authoritative state: one session, held in memory only.
  const session = new WorkspaceSession();

  socketServer.on("connection", (socket) => {
    const name = session.join(socket);
    log(`[realtime] open: ${name}`);
    session.send(socket, { type: "welcome", name });
    session.send(socket, { type: "workspace-state", bookmarks: session.bookmarks });
    session.broadcast({ type: "presence-updated", names: session.names });

    socket.on("message", (data, isBinary) => {
      const result = isBinary
        ? ({ isValid: false, reason: "Only text messages are supported." } as const)
        : validateClientMessage(data.toString(), knownEvidenceIds);
      if (!result.isValid) {
        // Refused, not fatal: tell the sender why, keep the connection and the state.
        log(`[realtime] rejected message from ${name}: ${result.reason}`);
        session.send(socket, { type: "error", message: result.reason });
        return;
      }
      const message = result.message;
      log(`[realtime] message from ${name}: ${message.type}`);
      switch (message.type) {
        case "toggle-bookmark":
          // The whole set goes out, not a "toggled E03" delta: a client that
          // missed a message is fixed by the next one. The sender gets it too.
          session.broadcast({
            type: "bookmarks-updated",
            bookmarks: session.toggleBookmark(message.evidenceId),
          });
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
