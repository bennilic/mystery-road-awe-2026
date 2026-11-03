import { test } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { WebSocketServer } from "ws";
import { ReconnectingSocket, type ConnectionStatus } from "./ReconnectingSocket.ts";

// Uses Node's built-in WebSocket client against a real `ws` server, the same
// protocol the browser speaks.

async function startServer(port = 0): Promise<{ server: WebSocketServer; port: number }> {
  const server = new WebSocketServer({ port, host: "127.0.0.1" });
  await new Promise((resolve) => server.once("listening", resolve));
  return { server, port: (server.address() as AddressInfo).port };
}

async function stopServer(server: WebSocketServer): Promise<void> {
  for (const client of server.clients) client.terminate();
  await new Promise((resolve) => server.close(resolve));
}

async function waitUntil(condition: () => boolean, timeoutMs = 3000): Promise<void> {
  const startedAt = Date.now();
  while (!condition() && Date.now() - startedAt < timeoutMs) {
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

function watch(url: string, retryDelayMs = 50) {
  const statuses: ConnectionStatus[] = [];
  const opens: boolean[] = [];
  const connection = new ReconnectingSocket({
    url,
    retryDelayMs,
    onStatusChange: (status) => statuses.push(status),
    onMessage: () => {},
    onOpen: (isReconnect) => opens.push(isReconnect),
  });
  return { connection, statuses, opens };
}

test("a first successful connection reports live and is not a reconnect", async () => {
  const { server, port } = await startServer();
  const { connection, statuses, opens } = watch(`ws://127.0.0.1:${port}`);
  connection.start();
  await waitUntil(() => statuses.includes("live"));
  assert.deepEqual(statuses, ["live"]);
  assert.deepEqual(opens, [false]);
  connection.stop();
  await stopServer(server);
});

test("after a loss it reconnects once and flags the new open as a reconnect", async () => {
  const { server, port } = await startServer();
  const { connection, statuses, opens } = watch(`ws://127.0.0.1:${port}`);
  connection.start();
  await waitUntil(() => statuses.includes("live"));
  for (const client of server.clients) client.terminate();
  await waitUntil(() => opens.length === 2);
  assert.deepEqual(statuses, ["live", "reconnecting", "live"]);
  assert.deepEqual(opens, [false, true]);
  connection.stop();
  await stopServer(server);
});

test("when the one retry fails it ends disconnected and a manual retry can succeed", async () => {
  const { server, port } = await startServer();
  const { connection, statuses, opens } = watch(`ws://127.0.0.1:${port}`);
  connection.start();
  await waitUntil(() => statuses.includes("live"));
  await stopServer(server);
  await waitUntil(() => statuses.at(-1) === "disconnected");
  assert.deepEqual(statuses, ["live", "reconnecting", "disconnected"]);

  const restarted = await startServer(port);
  connection.retryNow();
  await waitUntil(() => statuses.at(-1) === "live");
  assert.deepEqual(statuses.slice(-2), ["reconnecting", "live"]);
  assert.equal(opens.at(-1), true);
  connection.stop();
  await stopServer(restarted.server);
});

test("a deliberate stop does not trigger a status change or a retry", async () => {
  const { server, port } = await startServer();
  const { connection, statuses } = watch(`ws://127.0.0.1:${port}`);
  connection.start();
  await waitUntil(() => statuses.includes("live"));
  connection.stop();
  await new Promise((resolve) => setTimeout(resolve, 200));
  assert.deepEqual(statuses, ["live"]);
  await stopServer(server);
});

test("send reports false instead of throwing when the connection is not open", () => {
  const { connection } = watch("ws://127.0.0.1:1");
  assert.equal(connection.send("hello"), false);
});
