import { readFileSync } from "node:fs";
import { join } from "node:path";

// The ids a bookmark may refer to are exactly the ids in the case data. Read
// once at startup: the data files are static, and a missing or broken file
// should stop the server immediately with a clear message, not on the first click.
export function loadEvidenceIds(dataDirectory: string): ReadonlySet<string> {
  const filePath = join(dataDirectory, "evidence.json");
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(filePath, "utf-8"));
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Cannot read the evidence ids from ${filePath} (${reason}). Check that the file exists and is valid JSON.`,
      { cause: error },
    );
  }
  if (!Array.isArray(parsed)) {
    throw new Error(`${filePath} must contain a JSON array of evidence items.`);
  }
  const ids = parsed.flatMap((item: unknown) =>
    typeof item === "object" && item !== null && "id" in item && typeof item.id === "string"
      ? [item.id]
      : [],
  );
  return new Set(ids);
}
