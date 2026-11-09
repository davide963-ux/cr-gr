import type { Verdict } from "./games/types";
import { scoreTetris } from "./games/tetris";
import { scoreBrick } from "./games/brick";
import { startMines, moveMines, scoreMines } from "./games/mines";
import { scoreSort } from "./games/sort";

export type { Verdict };
export type GameDef = {
  /** `client` goes to the browser (never include secrets); `state` is stored server-side with the session. */
  start: (seed: string, options: any) => { client: Record<string, unknown>; state?: unknown };
  /** Re-checks the player's submission against the seed and the elapsed wall-clock time. */
  finish: (seed: string, body: any, elapsedMs: number, state: any) => Verdict;
  /** Optional per-move endpoint for games whose secrets must stay on the server (Minefield). */
  move?: (seed: string, state: any, body: any, elapsedMs: number) =>
    { state: unknown; reply: Record<string, unknown>; verdict?: Verdict } | { error: string };
};

// For replay games the seed is not a secret: the browser needs it to run the same engine.
const replay = (finish: (seed: string, body: any, ms: number) => Verdict): GameDef => ({ start: (seed) => ({ client: { seed } }), finish });

export const GAMES: Record<string, GameDef> = {
  blocks: replay(scoreTetris),
  bricks: replay(scoreBrick),
  sort: replay(scoreSort),
  mines: { start: startMines, finish: scoreMines, move: moveMines },
};

export const isGameId = (g: unknown): g is string => typeof g === "string" && Object.hasOwn(GAMES, g);

/** Public catalogue used by the UI (hub, home). */
export type CatalogEntry = { id: string; name: string; href: string; live: boolean; icon: string; desc: string; bg: string };
export const CATALOG: CatalogEntry[] = [
  { id: "blocks", name: "BLOCK STACK", href: "/play/blocks", live: true, icon: "▟▙", desc: "Stack blocks and clear lines. It gets faster the longer you last. Score 60+ to win.", bg: "linear-gradient(135deg,#8a5cff,#17e8e8)" },
  { id: "bricks", name: "BRICK CHAOS", href: "/play/bricks", live: true, icon: "▬●", desc: "Break bricks, shoot bullets, beat the bosses. Endless levels. Score 60+ to win.", bg: "linear-gradient(135deg,#ff5470,#ff9a1f)" },
  { id: "mines", name: "MINEFIELD", href: "/play/mines", live: true, icon: "✹", desc: "Open every safe square before the clock runs out. Faster = more points.", bg: "linear-gradient(135deg,#3ddc84,#0f4d6b)" },
  { id: "sort", name: "COLOR SORT", href: "/play/sort", live: true, icon: "◍◍", desc: "Sort the balls by colour within the move limit. Clear 2 levels to win.", bg: "linear-gradient(135deg,#ffd24a,#ff5470)" },
];
