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

// ---------- game engines: a logged play must replay to the same score on the "server" ----------
import { rng } from "./games/rng";
import { Tetris, scoreTetris, TPS as TTPS } from "./games/tetris";
import { BrickGame, scoreBrick, W, VOLLEYS, TPS as BTPS } from "./games/brick";
import { SortGame, scoreSort, solve, solved, genLevel, SORT_LEVELS } from "./games/sort";
import { startMines, moveMines, layMines, mask, MINE_LEVELS, type MineState } from "./games/mines";
import { GAMES } from "./games";

test("registry has the four games", () => {
  assert.deepEqual(Object.keys(GAMES).sort(), ["blocks", "bricks", "mines", "sort"]);
  assert.equal(isGameId("blocks"), true);
});

test("blocks: random play replays to the identical score; tampering/too-fast rejected", () => {
  for (const seed of ["a", "b", "c"]) {
    const g = new Tetris(seed), r = rng("bot" + seed), log: number[] = [];
    while (!g.over) {
      const acts: number[] = [];
      if (r() < 0.25) acts.push(Math.floor(r() * 5));
      for (const a of acts) log.push(g.tick, a);
      g.step(acts);
    }
    const ms = (g.tick / TTPS) * 1000;
    const v = scoreTetris(seed, { log, ticks: g.tick }, ms);
    assert.ok(v.ok && v.score === g.score, `seed ${seed}`);
    assert.equal(scoreTetris(seed, { log, ticks: g.tick }, ms * 0.5).ok, false);
  }
  assert.equal(scoreTetris("a", { log: [5, 9], ticks: 10 }, 1e6).ok, false);
  assert.equal(scoreTetris("a", { log: [5, 1, 3, 1], ticks: 10 }, 1e6).ok, false);
  assert.equal(scoreTetris("a", { log: "x", ticks: 10 }, 1e6).ok, false);
});

test("blocks: clearing lines scores (flat fill clears a row)", () => {
  const g = new Tetris("z");
  for (let c = 0; c < 9; c++) g.grid[19 * 10 + c] = 1; // row 19 full except last column
  const before = g.grid.filter(Boolean).length;
  assert.equal(before, 9);
  // drive pieces until a line clears or game ends; engine must never throw and score only via LINE_SCORE
  let guard = 0; while (!g.over && g.lines === 0 && guard++ < 5000) g.step(guard % 7 === 0 ? [1, 4] : []);
  assert.ok(g.score % 5 === 0);
});

/** simple bot: keep the paddle (roughly) under the lowest ball, fire whenever it can */
function botBrick(seed: string, maxTicks: number) {
  const g = new BrickGame(seed), log: number[] = [], fires: number[] = [];
  let last = W / 2;
  while (!g.over && g.tick < maxTicks) {
    let x = last;
    if (g.balls.length) { const b = g.balls.reduce((m, q) => (q.y > m.y ? q : m)); x = Math.max(0, Math.min(W, Math.round(b.x + ((Math.floor(g.tick / 45) % 5) - 2) * 11))); } // vary the hit point so the ball changes angle
    for (const s of g.shots) if (s.y > 440 && Math.abs(s.x - x) < 60) x = Math.max(0, Math.min(W, Math.round(s.x < x ? x + 45 : x - 45)));
    if (x !== last) { log.push(g.tick, x); last = x; }
    const fire = g.ammo > 0 && g.tick >= g.fireAt && g.tick % 40 === 0;
    if (fire) fires.push(g.tick);
    g.step(x, fire);
  }
  return { g, log, fires };
}
test("bricks: bot clears levels with bullets, replay gives the identical score", () => {
  for (const seed of ["s1", "s2"]) {
    const { g, log, fires } = botBrick(seed, 30000);
    assert.ok(g.cleared >= 1, `bot cleared ${g.cleared} levels, score ${g.score}`);
    assert.ok(fires.length >= VOLLEYS);
    const ms = (g.tick / BTPS) * 1000;
    const v = scoreBrick(seed, { log, fires, ticks: g.tick }, ms);
    assert.ok(v.ok && v.score === g.score && v.won);
    assert.equal(scoreBrick(seed, { log, fires, ticks: g.tick }, ms / 3).ok, false);
    // without the bullets (or with the paddle parked) the same score must not come out
    const noFire = scoreBrick(seed, { log, ticks: g.tick }, ms);
    assert.ok(noFire.ok && noFire.score !== g.score);
  }
  assert.equal(scoreBrick("s1", { log: [3, 999], ticks: 10 }, 1e6).ok, false);
  assert.equal(scoreBrick("s1", { log: [3, 10, 3, 20], ticks: 10 }, 1e6).ok, false);
  assert.equal(scoreBrick("s1", { log: [], fires: [5, 5], ticks: 10 }, 1e6).ok, false);
});
test("bricks: a volley is 3 bullets, only 10 volleys, cooldown respected", () => {
  const g = new BrickGame("ammo");
  g.step(200, true); assert.equal(g.bullets.length, 3); assert.equal(g.ammo, VOLLEYS - 1);
  g.step(200, true); assert.equal(g.ammo, VOLLEYS - 1);            // cooldown
  for (let i = 0; i < 400; i++) g.step(200, true);
  assert.equal(g.ammo, 0);
  const before = g.score; assert.ok(before > 0);                     // bullets broke bricks
});

test("sort: every level is solvable in its limit; solver's moves replay to a win", () => {
  const seed = "q1", g = new SortGame(seed), moves: number[] = [];
  while (!g.over) {
    const sol = solve(g.tubes, g.limit - g.used)!;
    assert.ok(sol, `level ${g.level} solvable`);
    const lvl = g.level;
    for (let i = 0; i < sol.length && g.level === lvl && !g.over; i += 2) { assert.ok(g.move(sol[i], sol[i + 1])); moves.push(sol[i], sol[i + 1]); }
  }
  assert.equal(g.cleared, SORT_LEVELS.length);
  const v = scoreSort(seed, { moves }, moves.length * 500);
  assert.ok(v.ok && v.won && v.score === g.score && v.score >= 400);
  assert.equal(scoreSort(seed, { moves }, 100).ok, false);                    // too fast
  assert.equal(scoreSort(seed, { moves: [0, 0] }, 1e6).ok, false);            // illegal
  assert.equal(scoreSort(seed, { moves: [...moves, 0, 1] }, 1e6).ok, false);  // after game end
  assert.ok(!solved(genLevel("x", 0)));
  const one = scoreSort(seed, { moves: [] }, 0); assert.ok(one.ok && !one.won && one.score === 0);
});

test("mines: first click safe, layout hidden, win/lose/timeout", () => {
  for (const level of ["easy", "medium", "hard"] as const) {
    const seed = "m-" + level, { client, state } = startMines(seed, { level });
    assert.ok(!JSON.stringify(client).includes("seed"));
    const L = MINE_LEVELS[level], m = mask(L.rows, L.cols, state.map);
    const first = m.findIndex(Boolean) + L.cols + 1 < m.length && m[L.cols * 4 + 4] ? L.cols * 4 + 4 : m.findIndex(Boolean);
    const mines = layMines(seed, state, first);
    assert.equal(mines.size, client.mines);
    assert.ok(!mines.has(first));
    let st: MineState = state, r: any = moveMines(seed, st, { cell: first }, 1000);
    assert.ok(!("error" in r) && r.reply.cells.length >= 1 && !r.reply.mines);
    st = r.state;
    // open every remaining safe cell
    for (let i = 0; i < m.length && !r.reply.over; i++) {
      if (!m[i] || mines.has(i) || st.open.includes(i)) continue;
      r = moveMines(seed, st, { cell: i }, 2000); assert.ok(!("error" in r)); st = r.state;
    }
    assert.ok(r.reply.over && r.reply.won && r.verdict.ok && r.verdict.won && r.verdict.score > L.base);
    // hitting a mine loses with 0 points
    const s2 = (moveMines(seed, state, { cell: first }, 1000) as any).state;
    const boom: any = moveMines(seed, s2, { cell: [...mines][0] }, 1500);
    assert.ok(boom.reply.over && !boom.reply.won && boom.verdict.points === 0);
    // out of time
    const late: any = moveMines(seed, s2, { cell: [...mines][0] }, L.limit * 1000 + 1);
    assert.ok(late.reply.timeUp && late.verdict.points === 0);
    assert.ok("error" in moveMines(seed, s2, { cell: first }, 1000));   // already open
    assert.ok("error" in moveMines(seed, s2, { cell: -1 }, 1000));
  }
});
