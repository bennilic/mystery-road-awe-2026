import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { fileURLToPath } from "node:url";
import { createBackend, RESOURCES } from "./app.ts";

const dataDirectory = fileURLToPath(new URL("../public/data", import.meta.url));

async function withBackend(run: (baseUrl: string) => Promise<void>): Promise<void> {
  const server = createBackend({ dataDirectory, defaultDelayMs: 0 });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

test("each endpoint returns exactly the content of its data file", async () => {
  await withBackend(async (baseUrl) => {
    for (const resource of RESOURCES) {
      const response = await fetch(`${baseUrl}/api/${resource}`);
      assert.equal(response.status, 200);
      const expected: unknown = JSON.parse(
        readFileSync(`${dataDirectory}/${resource}.json`, "utf-8"),
      );
      assert.deepEqual(await response.json(), expected);
    }
  });
});

test("?fail answers 500 by default and a chosen status on request", async () => {
  await withBackend(async (baseUrl) => {
    assert.equal((await fetch(`${baseUrl}/api/evidence?fail=1`)).status, 500);
    assert.equal((await fetch(`${baseUrl}/api/evidence?fail=503`)).status, 503);
  });
});

test("?empty=1 answers an empty collection and an empty case object", async () => {
  await withBackend(async (baseUrl) => {
    assert.deepEqual(await (await fetch(`${baseUrl}/api/timeline?empty=1`)).json(), []);
    assert.deepEqual(await (await fetch(`${baseUrl}/api/case?empty=1`)).json(), {});
  });
});

test("?delay=<ms> delays the response", async () => {
  await withBackend(async (baseUrl) => {
    const startedAt = Date.now();
    await fetch(`${baseUrl}/api/people?delay=300`);
    assert.ok(Date.now() - startedAt >= 290);
  });
});

test("unknown paths are 404 and non-GET methods are 405", async () => {
  await withBackend(async (baseUrl) => {
    assert.equal((await fetch(`${baseUrl}/api/nothing`)).status, 404);
    assert.equal((await fetch(`${baseUrl}/api/case`, { method: "POST" })).status, 405);
  });
});
