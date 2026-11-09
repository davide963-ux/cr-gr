// Minefield. The mine layout NEVER leaves the server: every click is a request, and the server
// answers only with the cells that click reveals. First click is always safe.
import { rng, shuffle } from "./rng";
import { bad, verdict, type Verdict } from "./types";

export const MINE_LEVELS = {
  easy: { rows: 9, cols: 9, density: 0.125, limit: 120, base: 100 },
  medium: { rows: 12, cols: 12, density: 0.165, limit: 240, base: 220 },
  hard: { rows: 16, cols: 16, density: 0.19, limit: 420, base: 400 },
} as const;
export type MineLevel = keyof typeof MINE_LEVELS;
export const MAPS = ["square", "diamond", "donut", "cross"] as const;
export type MineState = { level: MineLevel; map: number; n: number; first: number | null; open: number[] };

/** Which cells exist on this map shape. */
export function mask(rows: number, cols: number, map: number): boolean[] {
  const out: boolean[] = [], cr = (rows - 1) / 2, cc = (cols - 1) / 2, k = Math.floor(rows / 4);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    let on = true;
    if (map === 1) on = Math.abs(r - cr) + Math.abs(c - cc) <= rows * 0.75;
    else if (map === 2) on = !(Math.abs(r - cr) < rows / 6 && Math.abs(c - cc) < cols / 6);
    else if (map === 3) on = !((r < k || r >= rows - k) && (c < k || c >= cols - k));
    out.push(on);
  }
  return out;
}
function neighbors(i: number, rows: number, cols: number, m: boolean[]): number[] {
  const r = Math.floor(i / cols), c = i % cols, out: number[] = [];
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
    const rr = r + dr, c2 = c + dc;
    if ((dr || dc) && rr >= 0 && rr < rows && c2 >= 0 && c2 < cols && m[rr * cols + c2]) out.push(rr * cols + c2);
  }
  return out;
}
const mineCount = (level: MineLevel, m: boolean[]) => Math.round(m.filter(Boolean).length * MINE_LEVELS[level].density);

/** Mines are fixed by (seed, first click): the first cell and its neighbours are always safe. */
export function layMines(seed: string, st: Pick<MineState, "level" | "map">, first: number): Set<number> {
  const { rows, cols } = MINE_LEVELS[st.level], m = mask(rows, cols, st.map);
  const safe = new Set([first, ...neighbors(first, rows, cols, m)]);
  const cand: number[] = [];
  m.forEach((on, i) => { if (on && !safe.has(i)) cand.push(i); });
  shuffle(cand, rng(`${seed}:mines:${first}`));
  return new Set(cand.slice(0, mineCount(st.level, m)));
}

export function startMines(seed: string, options: any) {
  const level: MineLevel = options?.level in MINE_LEVELS ? options.level : "easy";
  const map = Math.floor(rng(seed + ":map")() * MAPS.length);
  const { rows, cols, limit } = MINE_LEVELS[level], m = mask(rows, cols, map);
  const state: MineState = { level, map, n: 0, first: null, open: [] };
  return {
    client: { level, rows, cols, mask: m.map((v) => (v ? 1 : 0)).join(""), mines: mineCount(level, m), limitMs: limit * 1000, map: MAPS[map] },
    state,
  };
}

/** One click. Returns the new state, what the client may see, and a verdict when the game ends. */
export function moveMines(seed: string, st: MineState, body: any, elapsedMs: number):
  { state: MineState; reply: Record<string, unknown>; verdict?: Verdict } | { error: string } {
  const L = MINE_LEVELS[st.level], { rows, cols } = L, m = mask(rows, cols, st.map), idx = body?.cell;
  if (!Number.isInteger(idx) || idx < 0 || idx >= rows * cols || !m[idx]) return { error: "bad cell" };
  const open = new Set(st.open);
  if (open.has(idx)) return { error: "already open" };
  const first = st.first ?? idx, mines = layMines(seed, st, first);
  const lose = (extra: Record<string, unknown>) =>
    ({ state: { ...st, first, n: st.n + 1 }, reply: { cells: [], over: true, won: false, mines: [...mines], score: 0, points: 0, ...extra }, verdict: verdict(0, false) });
  if (elapsedMs > L.limit * 1000) return lose({ timeUp: true });
  if (mines.has(idx)) return lose({ boom: idx });

  const cells: [number, number][] = [], stack = [idx];
  while (stack.length) {
    const i = stack.pop()!;
    if (open.has(i)) continue;
    open.add(i);
    const nb = neighbors(i, rows, cols, m), cnt = nb.filter((x) => mines.has(x)).length;
    cells.push([i, cnt]);
    if (cnt === 0) for (const x of nb) if (!open.has(x)) stack.push(x);
  }
  const state: MineState = { ...st, first, n: st.n + 1, open: [...open] };
  if (open.size === m.filter(Boolean).length - mines.size) {
    const score = L.base + Math.round(L.base * 0.5 * Math.max(0, 1 - elapsedMs / (L.limit * 1000)));
    return { state, reply: { cells, over: true, won: true, mines: [...mines], score, points: score }, verdict: verdict(score, true) };
  }
  return { state, reply: { cells, over: false } };
}

/** Calling finish on a minefield session = giving up. */
export const scoreMines = (): Verdict => verdict(0, false);
export { bad };
