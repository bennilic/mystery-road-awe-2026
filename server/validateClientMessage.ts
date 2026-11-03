import type { ClientMessage } from "../protocol/workspaceProtocol.ts";

export type ValidationResult =
  { isValid: true; message: ClientMessage } | { isValid: false; reason: string };

const MAX_SHOWN_VALUE_LENGTH = 40;

// A value from the network, shortened and quoted, so an error message (and the
// log line) cannot be flooded or made to look like something else.
function describeValue(value: unknown): string {
  const text = JSON.stringify(value) ?? String(value);
  return text.length > MAX_SHOWN_VALUE_LENGTH ? `${text.slice(0, MAX_SHOWN_VALUE_LENGTH)}…` : text;
}

function invalid(reason: string): ValidationResult {
  return { isValid: false, reason };
}

/**
 * Turns one raw text frame into a ClientMessage, or says why it is not one.
 * TypeScript types are erased at runtime and any client can send any bytes,
 * so this is the only thing that makes `ClientMessage` true on the server.
 * Never throws. Extra properties on a valid message are ignored.
 */
export function validateClientMessage(
  rawText: string,
  knownEvidenceIds: ReadonlySet<string>,
): ValidationResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return invalid("The message is not valid JSON.");
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return invalid('The message must be a JSON object with a string property "type".');
  }
  const candidate = parsed as Record<string, unknown>;

  switch (candidate.type) {
    case "request-state":
      return { isValid: true, message: { type: "request-state" } };
    case "toggle-bookmark": {
      const evidenceId = candidate.evidenceId;
      if (typeof evidenceId !== "string") {
        return invalid('toggle-bookmark needs a string property "evidenceId".');
      }
      if (!knownEvidenceIds.has(evidenceId)) {
        return invalid(`There is no evidence with the id ${describeValue(evidenceId)}.`);
      }
      return { isValid: true, message: { type: "toggle-bookmark", evidenceId } };
    }
    default:
      return invalid(`Unknown message type ${describeValue(candidate.type)}.`);
  }
}
