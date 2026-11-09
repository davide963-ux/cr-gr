/** Result of server-side scoring of one game session. */
export type Verdict = { ok: true; score: number; won: boolean; points: number } | { ok: false; reason: string };

export type GameDef = {
  /** Data sent to the browser when a session starts (never include the answers). */
  start: (seed: string) => Record<string, unknown>;
  /** Re-checks the player's submission against the secret seed and the elapsed wall-clock time. */
  finish: (seed: string, body: any, elapsedMs: number) => Verdict;
};

/** Game registry. Empty for now: add a game here + a page under src/app/play/<id>/. */
export const GAMES: Record<string, GameDef> = {};

export const isGameId = (g: unknown): g is string => typeof g === "string" && Object.hasOwn(GAMES, g);

/** Public catalogue used by the UI (hub, home). */
export type CatalogEntry = { id: string; name: string; href: string; live: boolean; icon: string; desc: string; bg: string };
export const CATALOG: CatalogEntry[] = [];
