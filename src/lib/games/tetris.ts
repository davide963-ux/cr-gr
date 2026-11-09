// Block Stack (tetris-style). Tick-based and fully deterministic: the same seed + input log
// always produces the same game, so the server can replay a submission and compute the score itself.
import { rng, shuffle } from "./rng";
import { bad, verdict, type Verdict } from "./types";

export const COLS = 10, ROWS = 20, TPS = 60, MAX_TICKS = 20 * 60 * TPS; // safety cap only (20 min); the game ends when the stack tops out
export const LINE_SCORE = [0, 20, 50, 80, 120];
export const SPEED_EVERY = 15 * TPS; // the fall speed steps up every 15 seconds played
export const WIN_SCORE = 60;
export const A = { LEFT: 0, RIGHT: 1, ROTATE: 2, SOFT: 3, HARD: 4 } as const;

// piece cells inside an n×n box (rotation 0)
const PIECES: { n: number; c: [number, number][] }[] = [
  { n: 4, c: [[0, 1], [1, 1], [2, 1], [3, 1]] }, // I
  { n: 2, c: [[0, 0], [1, 0], [0, 1], [1, 1]] }, // O
  { n: 3, c: [[1, 0], [0, 1], [1, 1], [2, 1]] }, // T
  { n: 3, c: [[1, 0], [2, 0], [0, 1], [1, 1]] }, // S
  { n: 3, c: [[0, 0], [1, 0], [1, 1], [2, 1]] }, // Z
  { n: 3, c: [[0, 0], [0, 1], [1, 1], [2, 1]] }, // J
  { n: 3, c: [[2, 0], [0, 1], [1, 1], [2, 1]] }, // L
];
const ROT: [number, number][][][] = PIECES.map((p) => {
  const out: [number, number][][] = [p.c];
  for (let r = 1; r < 4; r++) out.push(out[r - 1].map(([x, y]) => [p.n - 1 - y, x] as [number, number]));
  return out;
});
export const cellsOf = (type: number, rot: number) => ROT[type][rot & 3];

export class Tetris {
  grid: number[] = new Array(COLS * ROWS).fill(0); // 0 empty, else piece type + 1
  type = 0; rot = 0; x = 0; y = 0;
  next: number[] = [];
  lines = 0; score = 0; tick = 0; over = false;
  private g = 0; private bag: number[] = []; private rand: () => number;

  constructor(seed: string) {
    this.rand = rng(seed + ":blocks");
    for (let i = 0; i < 3; i++) this.next.push(this.draw());
    this.spawn();
  }
  private draw(): number {
    if (!this.bag.length) this.bag = shuffle([0, 1, 2, 3, 4, 5, 6], this.rand);
    return this.bag.pop()!;
  }
  private spawn() {
    this.type = this.next.shift()!; this.next.push(this.draw());
    this.rot = 0; this.x = Math.floor((COLS - PIECES[this.type].n) / 2); this.y = this.type === 0 ? -1 : 0;
    if (!this.fits(this.x, this.y, this.rot)) this.over = true;
  }
  fits(x: number, y: number, rot: number): boolean {
    for (const [dx, dy] of cellsOf(this.type, rot)) {
      const cx = x + dx, cy = y + dy;
      if (cx < 0 || cx >= COLS || cy >= ROWS) return false;
      if (cy >= 0 && this.grid[cy * COLS + cx]) return false;
    }
    return true;
  }
  /** Speed level: rises with time played, not with lines. */
  get level() { return Math.floor(this.tick / SPEED_EVERY); }
  get gravity() { return Math.max(4, 34 - this.level * 3); } // ticks per row
  ghostY(): number { let y = this.y; while (this.fits(this.x, y + 1, this.rot)) y++; return y; }

  private lock() {
    for (const [dx, dy] of cellsOf(this.type, this.rot)) {
      const cy = this.y + dy;
      if (cy < 0) { this.over = true; continue; }
      this.grid[cy * COLS + this.x + dx] = this.type + 1;
    }
    let cleared = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
      let full = true;
      for (let c = 0; c < COLS; c++) if (!this.grid[r * COLS + c]) { full = false; break; }
      if (full) { this.grid.splice(r * COLS, COLS); this.grid.unshift(...new Array(COLS).fill(0)); cleared++; r++; }
    }
    this.lines += cleared; this.score += LINE_SCORE[cleared];
    this.g = 0;
    if (!this.over) this.spawn();
  }
  private act(a: number) {
    if (a === A.LEFT) { if (this.fits(this.x - 1, this.y, this.rot)) this.x--; }
    else if (a === A.RIGHT) { if (this.fits(this.x + 1, this.y, this.rot)) this.x++; }
    else if (a === A.ROTATE) {
      const r = (this.rot + 1) & 3;
      for (const k of [0, -1, 1, -2, 2]) if (this.fits(this.x + k, this.y, r)) { this.x += k; this.rot = r; break; }
    } else if (a === A.SOFT) { if (this.fits(this.x, this.y + 1, this.rot)) { this.y++; this.g = 0; } }
    else if (a === A.HARD) { this.y = this.ghostY(); this.lock(); }
  }
  /** Advance one tick, applying this tick's actions first. */
  step(actions: number[]) {
    if (this.over) return;
    for (const a of actions) { if (this.over) break; this.act(a); }
    if (!this.over && ++this.g >= this.gravity) {
      this.g = 0;
      if (this.fits(this.x, this.y + 1, this.rot)) this.y++; else this.lock();
    }
    if (++this.tick >= MAX_TICKS) this.over = true;
  }
}

/** Server: replay the input log ([tick, action, tick, action, …]) and score it. */
export function scoreTetris(seed: string, body: any, elapsedMs: number): Verdict {
  const log = body?.log, ticks = body?.ticks;
  if (!Array.isArray(log) || log.length % 2 || log.length > 120000) return bad("bad log");
  if (!Number.isInteger(ticks) || ticks < 0 || ticks > MAX_TICKS) return bad("bad ticks");
  let prev = 0;
  for (let i = 0; i < log.length; i += 2) {
    const t = log[i], a = log[i + 1];
    if (!Number.isInteger(t) || t < prev || t >= MAX_TICKS || !Number.isInteger(a) || a < 0 || a > 4) return bad("malformed log");
    prev = t;
  }
  const g = new Tetris(seed);
  let i = 0;
  while (!g.over && g.tick < ticks) {
    const acts: number[] = [];
    while (i < log.length && log[i] === g.tick) { acts.push(log[i + 1]); i += 2; }
    if (acts.length > 8) return bad("too many inputs");
    g.step(acts);
  }
  if (elapsedMs < (g.tick / TPS) * 1000 * 0.9) return bad("finished too fast");
  return verdict(g.score, g.score >= WIN_SCORE);
}
