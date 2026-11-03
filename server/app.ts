import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Dev-only, read-only backend for Exercise 6. It serves the five files in
// public/data/ as GET /api/<resource> and can simulate a slow or failing
// server so the frontend's loading, error, empty and race handling can be
// shown live. It is NOT part of the GitHub Pages deploy (see README).

export const RESOURCES = ["case", "evidence", "people", "locations", "timeline"] as const;
export type ResourceName = (typeof RESOURCES)[number];

export interface ServerOptions {
  dataDirectory: string;
  // Added to every request; ?delay=<ms> on a request replaces it.
  defaultDelayMs: number;
}

const MAX_DELAY_MS = 30_000;

function isResourceName(value: string): value is ResourceName {
  return (RESOURCES as readonly string[]).includes(value);
}

function sendJson(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    // Without this a browser may serve a cached copy and the simulated delay/error would not show.
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(body));
}

function parseDelayMs(rawDelay: string | null, defaultDelayMs: number): number {
  if (rawDelay === null) return defaultDelayMs;
  const delayMs = Number(rawDelay);
  if (!Number.isFinite(delayMs) || delayMs < 0) return defaultDelayMs;
  return Math.min(delayMs, MAX_DELAY_MS);
}

function wait(delayMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

// Collections answer [] when ?empty=1; the single case object answers {}.
function emptyBodyFor(resource: ResourceName): unknown {
  return resource === "case" ? {} : [];
}

async function handleResource(
  resource: ResourceName,
  query: URLSearchParams,
  options: ServerOptions,
  response: ServerResponse,
): Promise<void> {
  await wait(parseDelayMs(query.get("delay"), options.defaultDelayMs));

  if (query.has("fail")) {
    const requestedStatus = Number(query.get("fail"));
    const status = requestedStatus >= 400 && requestedStatus <= 599 ? requestedStatus : 500;
    sendJson(response, status, {
      error: `Simulated failure of /api/${resource} (HTTP ${status}).`,
    });
    return;
  }
  if (query.get("empty") === "1") {
    sendJson(response, 200, emptyBodyFor(resource));
    return;
  }

  const fileContent = await readFile(join(options.dataDirectory, `${resource}.json`), "utf-8");
  response.writeHead(200, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(fileContent);
}

async function route(
  request: IncomingMessage,
  response: ServerResponse,
  options: ServerOptions,
): Promise<void> {
  const url = new URL(request.url ?? "/", "http://localhost");
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    sendJson(response, 405, { error: "This backend is read-only: only GET is allowed." });
    return;
  }
  const resource = url.pathname.replace(/^\/api\//, "");
  if (!url.pathname.startsWith("/api/") || !isResourceName(resource)) {
    sendJson(response, 404, {
      error: `Unknown endpoint ${url.pathname}. Available: ${RESOURCES.map((name) => `/api/${name}`).join(", ")}`,
    });
    return;
  }
  await handleResource(resource, url.searchParams, options, response);
}

export function createBackend(options: ServerOptions): Server {
  return createServer((request, response) => {
    route(request, response, options).catch((error: unknown) => {
      const reason = error instanceof Error ? error.message : String(error);
      console.error(`[backend] ${request.method} ${request.url} failed: ${reason}`);
      sendJson(response, 500, { error: `The backend could not read the data file: ${reason}` });
    });
  });
}
