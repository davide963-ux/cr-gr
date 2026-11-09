// Color Sort. Puzzles are generated from the seed and checked by a solver so every level is
// solvable within its move limit. The server replays the move list to score it.
import { rng, shuffle } from "./rng";
import { bad, verdict, type Verdict } from "./types";

export const CAP = 4;
/** More colours and a tighter move budget per ball each level. */
export const SORT_LEVELS = [
  { colors: 3, moves: 30, pts: 40 },
  { colors: 4, moves: 36, pts: 60 },
  { colors: 5, moves: 42, pts: 80 },
  { colors: 6, moves: 48, pts: 100 },
  { colors: 7, moves: 54, pts: 120 },
];
export const WIN_LEVELS = 2;
export type Tubes = number[][]; // each tube bottom → top

const top = (t: number[]) => t[t.length - 1];
const uniform = (t: number[]) => t.every((v) => v === t[0]);
export const canMove = (t: Tubes, a: number, b: number) =>
  a !== b && !!t[a]?.length && !!t[b] && t[b].length < CAP && (t[b].length === 0 || top(t[b]) === top(t[a]));
export const solved = (t: Tubes) => t.every((x) => x.length === 0 || (x.length === CAP && uniform(x)));

/** Depth-limited DFS. Returns a flat [from,to,…] solution of at most maxDepth moves, or null. */
export function solve(start: Tubes, maxDepth: number, nodeCap = 40000): number[] | null {
  const t = start.map((x) => [...x]), seen = new Map<string, number>(), path: number[] = [];
  let nodes = 0;
  const key = () => t.map((x) => x.join("")).sort().join("|");
  const dfs = (left: number): boolean => {
    if (solved(t)) return true;
    if (left === 0 || ++nodes > nodeCap) return false;
    const k = key();
    if ((seen.get(k) ?? -1) >= left) return false;
    seen.set(k, left);
    const moves: [number, number, number][] = [];
    for (let a = 0; a < t.length; a++) {
      if (!t[a].length || (t[a].length === CAP && uniform(t[a]))) continue;
      let usedEmpty = false;
      for (let b = 0; b < t.length; b++) {
        if (!canMove(t, a, b)) continue;
        if (!t[b].length) { if (usedEmpty || uniform(t[a])) continue; usedEmpty = true; moves.push([a, b, 1]); }
        else moves.push([a, b, 0]);
      }
    }
    moves.sort((x, y) => x[2] - y[2]);
    for (const [a, b] of moves) {
      t[b].push(t[a].pop()!); path.push(a, b);
      if (dfs(left - 1)) return true;
      path.length -= 2; t[a].push(t[b].pop()!);
    }
    return false;
  };
  return dfs(maxDepth) ? path : null;
}

/** Deterministic level: shuffle, keep the first layout the solver can finish within the move limit. */
export function genLevel(seed: string, level: number): Tubes {
  const { colors, moves } = SORT_LEVELS[level];
  let last: Tubes = [];
  for (let attempt = 0; attempt < 40; attempt++) {
    const balls: number[] = [];
    for (let c = 0; c < colors; c++) for (let i = 0; i < CAP; i++) balls.push(c);
    shuffle(balls, rng(`${seed}:sort:${level}:${attempt}`));
    const tubes: Tubes = [];
    for (let c = 0; c < colors; c++) tubes.push(balls.slice(c * CAP, c * CAP + CAP));
    tubes.push([], []);
    last = tubes;
    if (tubes.some((x) => uniform(x))) continue; // no free tubes at the start
    if (solve(tubes, moves - 6)) return tubes;   // leaves the player at least 6 spare moves
  }
  return last;
}

export class SortGame {
  level = 0; cleared = 0; score = 0; used = 0; over = false; tubes: Tubes;
  constructor(private seed: string) { this.tubes = genLevel(seed, 0); }
  get limit() { return SORT_LEVELS[this.level].moves; }
  /** Returns false (and changes nothing) for an illegal move. */
  move(a: number, b: number): boolean {
    if (this.over || !Number.isInteger(a) || !Number.isInteger(b) || !canMove(this.tubes, a, b)) return false;
    this.tubes[b].push(this.tubes[a].pop()!); this.used++;
    if (solved(this.tubes)) {
      this.score += SORT_LEVELS[this.level].pts + (this.limit - this.used); this.cleared++;
      if (this.level === SORT_LEVELS.length - 1) this.over = true;
      else { this.level++; this.used = 0; this.tubes = genLevel(this.seed, this.level); }
    } else if (this.used >= this.limit) this.over = true;
    return true;
  }
}

/** Server: replay the flat move list [from, to, from, to, …]. */
export function scoreSort(seed: string, body: any, elapsedMs: number): Verdict {
  const moves = body?.moves;
  if (!Array.isArray(moves) || moves.length % 2 || moves.length > 2 * SORT_LEVELS.reduce((s, l) => s + l.moves, 0)) return bad("bad moves");
  if (elapsedMs < (moves.length / 2) * 200) return bad("finished too fast");
  const g = new SortGame(seed);
  for (let i = 0; i < moves.length; i += 2) if (!g.move(moves[i], moves[i + 1])) return bad("illegal move");
  return verdict(g.score, g.cleared >= WIN_LEVELS);
}
