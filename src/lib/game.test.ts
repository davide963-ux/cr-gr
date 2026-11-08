import test from "node:test";
import assert from "node:assert/strict";
import { buildRounds, scoreSession, TILES, MIN_CLICK_GAP_MS } from "./game";
import { parseXHandle } from "./x";
import { parseEmail, hashToken } from "./email";
import { weekStart, previousWeekStart } from "./weeks";

test("rounds are deterministic and have exactly one matching tile", () => {
  const a = buildRounds("seed"), b = buildRounds("seed");
  assert.deepEqual(a, b);
  a.rounds.forEach((r, i) => {
    const m = r.tiles.map((t, k) => (t.startsWith(r.target) ? k : -1)).filter((k) => k >= 0);
    assert.deepEqual(m, [a.answers[i]]);
    assert.equal(r.tiles.length, TILES);
  });
});

test("perfect play wins; wrong play scores 0", () => {
  const { answers } = buildRounds("s");
  const good = answers.slice(0, 20).map((tile, i) => ({ round: i, tile, t: 300 + i * 300 }));
  const v = scoreSession("s", good, 30_000);
  assert.ok(v.ok && v.won && v.score === 200 && v.points === 200);
  const bad = answers.slice(0, 20).map((a, i) => ({ round: i, tile: (a + 1) % TILES, t: 300 + i * 300 }));
  const w = scoreSession("s", bad, 30_000);
  assert.ok(w.ok && !w.won && w.score === 0);
});

test("anti-cheat: too fast, too early, out of order", () => {
  const { answers } = buildRounds("s");
  const fast = answers.slice(0, 5).map((tile, i) => ({ round: i, tile, t: i * (MIN_CLICK_GAP_MS - 50) + 300 }));
  assert.equal(scoreSession("s", fast, 30_000).ok, false);
  assert.equal(scoreSession("s", [], 5_000).ok, false);
  assert.equal(scoreSession("s", [{ round: 3, tile: 0, t: 500 }], 30_000).ok, false);
});

test("weeks start on Monday UTC", () => {
  assert.equal(weekStart(new Date("2026-11-08T12:00:00Z")), "2026-11-02"); // Sunday -> Mon 2 Nov
  assert.equal(weekStart(new Date("2026-11-09T00:00:00Z")), "2026-11-09"); // Monday itself
  assert.equal(previousWeekStart(new Date("2026-11-09T00:05:00Z")), "2026-11-02");
});

test("X handle parsing", () => {
  assert.equal(parseXHandle("@Davide_96"), "Davide_96");
  assert.equal(parseXHandle("https://x.com/hashrush?s=20"), "hashrush");
  assert.equal(parseXHandle("  name "), "name");
  assert.equal(parseXHandle("bad handle!"), null);
  assert.equal(parseXHandle("waytoolongusername123"), null);
  assert.equal(parseXHandle(""), null);
});

test("email parsing + token hashing", () => {
  assert.equal(parseEmail("  Foo@Example.COM "), "foo@example.com");
  assert.equal(parseEmail("nope"), null);
  assert.equal(parseEmail("a b@c.com"), null);
  assert.equal(hashToken("x"), hashToken("x"));
  assert.notEqual(hashToken("x"), hashToken("y"));
});
