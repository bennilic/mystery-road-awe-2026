import { test } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { fileURLToPath } from "node:url";
import { WebSocket } from "ws";
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

function nextMessage(socket: WebSocket): Promise<string> {
  return new Promise((resolve) => socket.once("message", (data) => resolve(data.toString())));
}

// The server notices a close a moment after the client does, so poll briefly.
async function waitUntil(condition: () => boolean): Promise<void> {
  for (let attempt = 0; attempt < 100 && !condition(); attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

test("a client connects, sends one message and receives one reply", async () => {
  await withBackend(async (socketUrl, log) => {
    const socket = new WebSocket(socketUrl);
    await new Promise((resolve) => socket.once("open", resolve));
    const reply = nextMessage(socket);
    socket.send("hello");
    assert.equal(await reply, "Server received: hello");
    await new Promise<void>((resolve) => {
      socket.once("close", () => resolve());
      socket.close(1000);
    });
    await waitUntil(() => log.some((line) => line.startsWith("[realtime] close")));
    assert.ok(log.includes("[realtime] open"));
    assert.ok(log.includes("[realtime] message: hello"));
    assert.ok(log.some((line) => line.startsWith("[realtime] close")));
  });
});

test("a WebSocket request to an unknown path is refused", async () => {
  await withBackend(async (socketUrl) => {
    const socket = new WebSocket(socketUrl.replace("/ws", "/nothing"));
    const failure = await new Promise<Error>((resolve) => socket.once("error", resolve));
    assert.match(failure.message, /400|404/);
  });
});
