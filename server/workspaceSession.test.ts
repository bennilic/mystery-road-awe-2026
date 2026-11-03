import { test } from "node:test";
import assert from "node:assert/strict";
import { WebSocket } from "ws";
import type { ServerMessage } from "../protocol/workspaceProtocol.ts";
import { WorkspaceSession } from "./workspaceSession.ts";

// Just enough of a socket for the session: it records what was sent to it.
function fakeSocket(readyState: number = WebSocket.OPEN): {
  socket: WebSocket;
  sent: ServerMessage[];
} {
  const sent: ServerMessage[] = [];
  const socket = {
    readyState,
    send: (frame: string) => sent.push(JSON.parse(frame) as ServerMessage),
  } as unknown as WebSocket;
  return { socket, sent };
}

test("join gives every connection its own name and leave removes it", () => {
  const session = new WorkspaceSession();
  const first = fakeSocket().socket;
  const second = fakeSocket().socket;
  const firstName = session.join(first);
  const secondName = session.join(second);
  assert.notEqual(firstName, secondName);
  assert.deepEqual(session.names.sort(), [firstName, secondName].sort());
  session.leave(first);
  assert.deepEqual(session.names, [secondName]);
});

test("toggling adds an absent id and removes a present one", () => {
  const session = new WorkspaceSession();
  assert.deepEqual(session.toggleBookmark("E01"), ["E01"]);
  assert.deepEqual(session.toggleBookmark("E03"), ["E01", "E03"]);
  assert.deepEqual(session.toggleBookmark("E01"), ["E03"]);
});

test("broadcast reaches every open connection and skips one that is closing", () => {
  const session = new WorkspaceSession();
  const open = fakeSocket();
  const closing = fakeSocket(WebSocket.CLOSING);
  session.join(open.socket);
  session.join(closing.socket);
  session.broadcast({ type: "bookmarks-updated", bookmarks: ["E01"] });
  assert.deepEqual(open.sent, [{ type: "bookmarks-updated", bookmarks: ["E01"] }]);
  assert.deepEqual(closing.sent, []);
});
