import test from "node:test";
import assert from "node:assert/strict";
import { parseXHandle } from "./x";
import { weekStart, previousWeekStart, nextWeekStart } from "./weeks";
import { isGameId } from "./games";

test("weeks start on Monday UTC", () => {
  assert.equal(weekStart(new Date("2026-11-08T12:00:00Z")), "2026-11-02"); // Sunday -> Mon 2 Nov
  assert.equal(weekStart(new Date("2026-11-09T00:00:00Z")), "2026-11-09"); // Monday itself
  assert.equal(previousWeekStart(new Date("2026-11-09T00:05:00Z")), "2026-11-02");
  assert.equal(nextWeekStart(new Date("2026-11-08T12:00:00Z")).toISOString(), "2026-11-09T00:00:00.000Z");
});

test("X handle parsing", () => {
  assert.equal(parseXHandle("@Davide_96"), "Davide_96");
  assert.equal(parseXHandle("https://x.com/hashrush?s=20"), "hashrush");
  assert.equal(parseXHandle("  name "), "name");
  assert.equal(parseXHandle("bad handle!"), null);
  assert.equal(parseXHandle("waytoolongusername123"), null);
  assert.equal(parseXHandle(""), null);
});

test("game registry rejects unknown / prototype keys", () => {
  assert.equal(isGameId("hashrush"), false);
  assert.equal(isGameId("toString"), false);
  assert.equal(isGameId(42), false);
});
