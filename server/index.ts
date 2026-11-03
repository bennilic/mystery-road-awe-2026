import { fileURLToPath } from "node:url";
import { createBackend } from "./app.ts";

// Environment: PORT (default 3001), SIM_DELAY_MS (default 0, added to every response).
const port = Number(process.env.PORT ?? 3001);
const defaultDelayMs = Number(process.env.SIM_DELAY_MS ?? 0);
const dataDirectory = fileURLToPath(new URL("../public/data", import.meta.url));

createBackend({ dataDirectory, defaultDelayMs }).listen(port, "127.0.0.1", () => {
  console.log(
    `[backend] read-only API on http://127.0.0.1:${port}/api/<case|evidence|people|locations|timeline>`,
  );
  console.log("[backend] simulate with ?delay=<ms>, ?fail=1 (or ?fail=503), ?empty=1");
});
