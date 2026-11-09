import test from "node:test";
import assert from "node:assert/strict";
import { buildRounds, scoreSession, TILES, MIN_CLICK_GAP_MS } from "./game";
import { parseXHandle } from "./x";
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

import { buildSequence, scoreChain, minPlaybackMs, WIN_LEVELS } from "./chain";

/** flat presses for `levels` perfect levels */
const perfect = (seed: string, levels: number) => { const s = buildSequence(seed); const out: number[] = []; for (let L = 1; L <= levels; L++) out.push(...s.slice(0, L)); return out; };

test("chain: sequence deterministic, perfect play wins", () => {
  assert.deepEqual(buildSequence("q"), buildSequence("q"));
  const v = scoreChain("q", perfect("q", 8), minPlaybackMs(8) + 5000);
  assert.ok(v.ok && v.won && v.score === 120 && v.points === 120);
});

test("chain: fewer than win levels scores 0 points; mistake ends the game", () => {
  const s = buildSequence("q");
  const six = scoreChain("q", perfect("q", 6), minPlaybackMs(6) + 3000);
  assert.ok(six.ok && !six.won && six.points === 0 && six.score === 90);
  const wrong = [...perfect("q", 3), (s[0] + 1) % 4]; // level 4 first press wrong
  const w = scoreChain("q", wrong, minPlaybackMs(4) + 3000);
  assert.ok(w.ok && w.score === 45 && !w.won);
  assert.equal(scoreChain("q", [...wrong, 0], minPlaybackMs(4) + 3000).ok, false); // press after mistake
});

test("chain: anti-cheat wall clock and malformed input", () => {
  assert.equal(scoreChain("q", perfect("q", WIN_LEVELS), 5000).ok, false);            // too fast
  assert.equal(scoreChain("q", [9], 10_000).ok, false);                                // bad pad
  assert.equal(scoreChain("q", "x", 10_000).ok, false);
  assert.equal(scoreChain("q", perfect("q", 3), 16 * 60_000).ok, false);               // expired
  assert.ok(scoreChain("q", [], 0).ok);                                                // quitting at once is fine
});
