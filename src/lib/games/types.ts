/** Result of server-side scoring of one game session. */
export type Verdict = { ok: true; score: number; won: boolean; points: number } | { ok: false; reason: string };
export const verdict = (score: number, won: boolean): Verdict => ({ ok: true, score, won, points: won ? score : 0 });
export const bad = (reason: string): Verdict => ({ ok: false, reason });
