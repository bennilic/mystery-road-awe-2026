import { test } from "node:test";
import assert from "node:assert/strict";
import { validateClientMessage } from "./validateClientMessage.ts";

const knownIds = new Set(["E01", "E02"]);

test("valid messages are accepted and extra properties are dropped", () => {
  assert.deepEqual(validateClientMessage('{"type":"request-state"}', knownIds), {
    isValid: true,
    message: { type: "request-state" },
  });
  assert.deepEqual(
    validateClientMessage('{"type":"toggle-bookmark","evidenceId":"E02","extra":1}', knownIds),
    { isValid: true, message: { type: "toggle-bookmark", evidenceId: "E02" } },
  );
});

const rejected: ReadonlyArray<[label: string, rawText: string, reasonPattern: RegExp]> = [
  ["malformed JSON", "{not json", /not valid JSON/],
  ["empty text", "", /not valid JSON/],
  ["a JSON string", '"toggle-bookmark"', /must be a JSON object/],
  ["null", "null", /must be a JSON object/],
  ["an array", "[1,2]", /must be a JSON object/],
  ["no type", "{}", /Unknown message type undefined/],
  ["a numeric type", '{"type":5}', /Unknown message type 5/],
  ["an unknown type", '{"type":"delete-everything"}', /Unknown message type "delete-everything"/],
  ["a toggle without id", '{"type":"toggle-bookmark"}', /needs a string property/],
  ["a numeric id", '{"type":"toggle-bookmark","evidenceId":1}', /needs a string property/],
  [
    "an unknown id",
    '{"type":"toggle-bookmark","evidenceId":"E99"}',
    /no evidence with the id "E99"/,
  ],
  [
    "an inherited property name",
    '{"type":"toggle-bookmark","evidenceId":"constructor"}',
    /no evidence/,
  ],
];

for (const [label, rawText, reasonPattern] of rejected) {
  test(`rejects ${label} with a reason`, () => {
    const result = validateClientMessage(rawText, knownIds);
    assert.equal(result.isValid, false);
    assert.match(result.isValid ? "" : result.reason, reasonPattern);
  });
}

test("a very long value is shortened in the reason", () => {
  const result = validateClientMessage(
    JSON.stringify({ type: "toggle-bookmark", evidenceId: "x".repeat(5000) }),
    knownIds,
  );
  assert.equal(result.isValid, false);
  assert.ok((result.isValid ? "" : result.reason).length < 120);
});
