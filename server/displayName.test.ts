import { test } from "node:test";
import assert from "node:assert/strict";
import { createDisplayName } from "./displayName.ts";

test("names look like Investigator-<number> with a two-digit number", () => {
  for (let run = 0; run < 200; run++) {
    assert.match(createDisplayName(new Set()), /^Investigator-[1-9][0-9]$/);
  }
});

test("a taken name is never handed out again", () => {
  const alwaysFortyTwo = () => (42 - 10) / 90;
  const taken = new Set(["Investigator-42", "Investigator-43"]);
  assert.equal(createDisplayName(new Set(), alwaysFortyTwo), "Investigator-42");
  assert.equal(createDisplayName(taken, alwaysFortyTwo), "Investigator-44");
});

test("when every two-digit name is taken it continues with three digits", () => {
  const taken = new Set(Array.from({ length: 90 }, (_, index) => `Investigator-${10 + index}`));
  assert.equal(
    createDisplayName(taken, () => 0),
    "Investigator-100",
  );
});
