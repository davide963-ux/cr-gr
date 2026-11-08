import { createHmac } from "node:crypto";

// ---- HashRush rules (server-authoritative) ----
export const DURATION_MS = 30_000;
export const GRACE_MS = 5_000;       // network slack when checking wall-clock time
export const MIN_CLICK_GAP_MS = 250; // faster than this is not human
export const MAX_ROUNDS = 120;       // DURATION / MIN_CLICK_GAP
export const TILES = 12;
export const CORRECT = 10;
export const WRONG = -5;
export const WIN_SCORE = 100;        // score needed to count as a "won game"

export type Round = { target: string; tiles: string[] };
export type Click = { round: number; tile: number; t: number };

const bytes = (seed: string, label: string) =>
  createHmac("sha256", seed).update(label).digest();

/** Deterministic rounds from the secret seed: same seed => same rounds. */
export function buildRounds(seed: string, n = MAX_ROUNDS): { rounds: Round[]; answers: number[] } {
  const rounds: Round[] = [];
  const answers: number[] = [];
  for (let i = 0; i < n; i++) {
    const b = bytes(seed, `round:${i}`);
    const target = b.subarray(0, 2).toString("hex").slice(0, 3); // 3 hex chars
    const answer = b[2] % TILES;
    const tiles: string[] = [];
    for (let k = 0; k < TILES; k++) {
      let h = bytes(seed, `tile:${i}:${k}`).toString("hex").slice(0, 8);
      // exactly one tile starts with the target; all others must not
      if (k === answer) h = target + h.slice(3);
      else if (h.startsWith(target)) h = ((parseInt(h[0], 16) + 1) % 16).toString(16) + h.slice(1);
      tiles.push(h);
    }
    rounds.push({ target, tiles });
    answers.push(answer);
  }
  return { rounds, answers };
}

export type Verdict = { ok: true; score: number; won: boolean; points: number } | { ok: false; reason: string };

/** Replay the client's clicks against the server's answers. */
export function scoreSession(seed: string, clicks: Click[], serverElapsedMs: number): Verdict {
  if (serverElapsedMs < DURATION_MS - GRACE_MS) return { ok: false, reason: "finished too early" };
  if (serverElapsedMs > DURATION_MS + GRACE_MS + 10_000) return { ok: false, reason: "session expired" };
  if (!Array.isArray(clicks) || clicks.length > MAX_ROUNDS) return { ok: false, reason: "bad clicks" };

  const { answers } = buildRounds(seed);
  let score = 0;
  let lastT = -Infinity;
  for (let i = 0; i < clicks.length; i++) {
    const c = clicks[i];
    if (!Number.isInteger(c.round) || !Number.isInteger(c.tile) || typeof c.t !== "number")
      return { ok: false, reason: "malformed click" };
    if (c.round !== i) return { ok: false, reason: "rounds out of order" };
    if (c.tile < 0 || c.tile >= TILES) return { ok: false, reason: "bad tile" };
    if (c.t - lastT < MIN_CLICK_GAP_MS) return { ok: false, reason: "clicking too fast" };
    if (c.t > DURATION_MS + GRACE_MS) return { ok: false, reason: "click after game end" };
    lastT = c.t;
    if (c.t <= DURATION_MS) score += c.tile === answers[i] ? CORRECT : WRONG;
  }
  score = Math.max(0, score);
  const won = score >= WIN_SCORE;
  return { ok: true, score, won, points: won ? score : 0 };
}
