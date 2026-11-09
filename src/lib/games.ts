import { buildRounds, scoreSession, type Verdict } from "./game";
import { buildSequence, scoreChain } from "./chain";

export type GameId = "hashrush" | "chain";

/** Each game: what the client receives at start, and how the server scores the submission. */
export const GAMES: Record<GameId, {
  start: (seed: string) => Record<string, unknown>;
  finish: (seed: string, body: any, elapsedMs: number) => Verdict;
}> = {
  hashrush: {
    start: (seed) => ({ rounds: buildRounds(seed).rounds }), // answers never leave the server
    finish: (seed, body, ms) => scoreSession(seed, body?.clicks, ms),
  },
  chain: {
    start: (seed) => ({ sequence: buildSequence(seed) }),
    finish: (seed, body, ms) => scoreChain(seed, body?.presses, ms),
  },
};

export const isGameId = (g: unknown): g is GameId => typeof g === "string" && g in GAMES;

/** Public catalogue used by the UI (hub, home, sidebar). */
export const CATALOG = [
  { id: "hashrush", name: "HASH RUSH", href: "/play/hashrush", live: true, icon: "#A3F", desc: "Find the matching hash in 30s. Score 100+ to win.", bg: "linear-gradient(135deg,#ff9a1f,#8a5cff)" },
  { id: "chain", name: "CHAIN MEMORY", href: "/play/chain", live: true, icon: "▣▣", desc: "Repeat the glowing block sequence. Reach level 7 to win.", bg: "linear-gradient(135deg,#17e8e8,#8a5cff)" },
  { id: "stack", name: "BLOCK STACK", href: "", live: false, icon: "▦", desc: "Coming soon", bg: "linear-gradient(135deg,#0f4d6b,#1a1a4d)" },
  { id: "nonce", name: "NONCE HUNTER", href: "", live: false, icon: "⛏", desc: "Coming soon", bg: "linear-gradient(135deg,#3b2a7a,#1a1a4d)" },
] as const;
