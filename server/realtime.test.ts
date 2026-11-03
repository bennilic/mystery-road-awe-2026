import { test } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { fileURLToPath } from "node:url";
import { WebSocket } from "ws";
import type { ClientMessage } from "../protocol/workspaceProtocol.ts";
import { createBackend } from "./app.ts";

const dataDirectory = fileURLToPath(new URL("../public/data", import.meta.url));

async function withBackend(
  run: (socketUrl: string, log: string[]) => Promise<void>,
): Promise<void> {
  const log: string[] = [];
  const server = createBackend({ dataDirectory, defaultDelayMs: 0, log: (line) => log.push(line) });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  try {
    await run(`ws://127.0.0.1:${port}/ws`, log);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

// The server notices a close a moment after the client does, so poll briefly.
async function waitUntil(condition: () => boolean): Promise<void> {
  for (let attempt = 0; attempt < 100 && !condition(); attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

function collectMessages(socket: WebSocket): unknown[] {
  const messages: unknown[] = [];
  socket.on("message", (data) => messages.push(JSON.parse(data.toString())));
  return messages;
}

async function connect(socketUrl: string): Promise<{ socket: WebSocket; messages: unknown[] }> {
  const socket = new WebSocket(socketUrl);
  const messages = collectMessages(socket);
  await new Promise((resolve) => socket.once("open", resolve));
  return { socket, messages };
}

test("a new connection gets a welcome with its own name and the presence list", async () => {
  await withBackend(async (socketUrl) => {
    const { socket, messages } = await connect(socketUrl);
    await waitUntil(() => messages.length >= 3);
    const [welcome, , presence] = messages as [{ name: string }, unknown, { names: string[] }];
    assert.match(welcome.name, /^Investigator-\d+$/);
    assert.deepEqual(presence, { type: "presence-updated", names: [welcome.name] });
    socket.close();
  });
});

test("a new connection is sent the current shared bookmarks, and request-state repeats them", async () => {
  await withBackend(async (socketUrl) => {
    const { socket, messages } = await connect(socketUrl);
    await waitUntil(() => messages.length >= 3);
    assert.deepEqual(messages[1], { type: "workspace-state", bookmarks: [] });
    const request: ClientMessage = { type: "request-state" };
    socket.send(JSON.stringify(request));
    await waitUntil(() => messages.length >= 4);
    assert.deepEqual(messages.at(-1), { type: "workspace-state", bookmarks: [] });
    socket.close();
  });
});

function lastBookmarks(messages: unknown[]): string[] | undefined {
  const updates = messages.filter(
    (message) => (message as { type: string }).type === "bookmarks-updated",
  ) as { bookmarks: string[] }[];
  return updates.at(-1)?.bookmarks;
}

test("a toggle from one client is broadcast to every client, including the sender", async () => {
  await withBackend(async (socketUrl) => {
    const first = await connect(socketUrl);
    const second = await connect(socketUrl);
    const toggle: ClientMessage = { type: "toggle-bookmark", evidenceId: "E03" };
    first.socket.send(JSON.stringify(toggle));
    await waitUntil(() => lastBookmarks(second.messages) !== undefined);
    assert.deepEqual(lastBookmarks(second.messages), ["E03"]);
    assert.deepEqual(lastBookmarks(first.messages), ["E03"]);

    second.socket.send(JSON.stringify(toggle));
    await waitUntil(() => lastBookmarks(first.messages)?.length === 0);
    assert.deepEqual(lastBookmarks(first.messages), []);
    first.socket.close();
    second.socket.close();
  });
});

test("a client that joins later is sent the bookmarks set before it joined", async () => {
  await withBackend(async (socketUrl) => {
    const early = await connect(socketUrl);
    early.socket.send(JSON.stringify({ type: "toggle-bookmark", evidenceId: "E01" }));
    await waitUntil(() => lastBookmarks(early.messages) !== undefined);
    const late = await connect(socketUrl);
    await waitUntil(() => late.messages.length >= 2);
    assert.deepEqual(late.messages[1], { type: "workspace-state", bookmarks: ["E01"] });
    early.socket.close();
    late.socket.close();
  });
});

test("presence lists every open connection and drops a closed one", async () => {
  await withBackend(async (socketUrl, log) => {
    const first = await connect(socketUrl);
    const second = await connect(socketUrl);
    await waitUntil(() => second.messages.length >= 3);
    const lastOf = (messages: unknown[]) => messages[messages.length - 1] as { names: string[] };
    assert.equal(lastOf(second.messages).names.length, 2);
    assert.notEqual(lastOf(second.messages).names[0], lastOf(second.messages).names[1]);

    first.socket.close(1000);
    await waitUntil(() => lastOf(second.messages).names.length === 1);
    assert.equal(lastOf(second.messages).names.length, 1);
    assert.ok(log.some((line) => line.startsWith("[realtime] close")));
    second.socket.close();
  });
});

test("typed client messages are logged by type and a broken frame does not crash the server", async () => {
  await withBackend(async (socketUrl, log) => {
    const { socket, messages } = await connect(socketUrl);
    const request: ClientMessage = { type: "request-state" };
    socket.send(JSON.stringify(request));
    socket.send("this is not json");
    await waitUntil(() => log.some((line) => line.includes("ignored unreadable")));
    assert.ok(log.some((line) => line.endsWith(": request-state")));
    // Still serving: a new connection is welcomed.
    const second = await connect(socketUrl);
    await waitUntil(() => second.messages.length >= 1);
    assert.equal((second.messages[0] as { type: string }).type, "welcome");
    assert.ok(messages.length >= 1);
    socket.close();
    second.socket.close();
  });
});

test("a WebSocket request to an unknown path is refused", async () => {
  await withBackend(async (socketUrl) => {
    const socket = new WebSocket(socketUrl.replace("/ws", "/nothing"));
    const failure = await new Promise<Error>((resolve) => socket.once("error", resolve));
    assert.match(failure.message, /400|404/);
  });
});
