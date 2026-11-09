import { createHmac } from "node:crypto";
import type { Verdict } from "./game";

// ---- Chain Memory rules (server-authoritative) ----
export const PADS = 4;
export const MAX_LEVELS = 20;
export const POINTS_PER_LEVEL = 15;
export const WIN_LEVELS = 7;          // completed levels needed to count as a win (7 * 15 = 105 pts)
export const STEP_MS = 700;           // one block lit (400ms) + gap (300ms) while showing the sequence
export const PAUSE_MS = 600;          // pause before each level's playback
export const MAX_SESSION_MS = 15 * 60_000;
const TOLERANCE = 0.95;               // network slack on the wall-clock check

export function buildSequence(seed: string, n = MAX_LEVELS): number[] {
  const b = createHmac("sha256", seed).update("chain").digest();
  const out: number[] = [];
  for (let i = 0; i < n; i++) out.push(b[i] % PADS);
  return out;
}

/** Minimum real time needed just to watch the playback of levels 1..n. */
export function minPlaybackMs(levels: number): number {
  let t = 0;
  for (let L = 1; L <= levels; L++) t += PAUSE_MS + L * STEP_MS;
  return t;
}

/** Replay the player's flat list of presses (all levels, in order) against the secret sequence. */
export function scoreChain(seed: string, presses: unknown, elapsedMs: number): Verdict {
  if (!Array.isArray(presses) || presses.length > (MAX_LEVELS * (MAX_LEVELS + 1)) / 2)
    return { ok: false, reason: "bad presses" };
  if (elapsedMs > MAX_SESSION_MS) return { ok: false, reason: "session expired" };

  const seq = buildSequence(seed);
  let completed = 0, idx = 0, mistake = false;
  for (const p of presses) {
    if (!Number.isInteger(p) || p < 0 || p >= PADS) return { ok: false, reason: "malformed press" };
    if (mistake || completed >= MAX_LEVELS) return { ok: false, reason: "presses after game end" };
    if (p !== seq[idx]) { mistake = true; continue; }
    idx++;
    if (idx === completed + 1) { completed++; idx = 0; }
  }
  // levels whose playback the player must have sat through
  const attempted = completed + (mistake || idx > 0 ? 1 : 0);
  if (elapsedMs < minPlaybackMs(attempted) * TOLERANCE) return { ok: false, reason: "finished too fast" };

  const score = completed * POINTS_PER_LEVEL;
  const won = completed >= WIN_LEVELS;
  return { ok: true, score, won, points: won ? score : 0 };
}
