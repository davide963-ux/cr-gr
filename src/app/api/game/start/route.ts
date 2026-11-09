import { randomBytes } from "node:crypto";
import { sql } from "@/lib/db";
import { getPlayerId } from "@/lib/auth";
import { GAMES, isGameId } from "@/lib/games";
import { weekStart } from "@/lib/weeks";

const MAX_GAMES_PER_DAY = 50; // per game

export async function POST(req: Request) {
  const playerId = await getPlayerId();
  if (!playerId) return Response.json({ error: "sign in first" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const game = body?.game;
  if (!isGameId(game)) return Response.json({ error: "unknown game" }, { status: 400 });

  const [{ n }] = await sql`select count(*)::int as n from game_sessions where player_id = ${playerId} and game = ${game} and started_at > now() - interval '1 day'`;
  if (n >= MAX_GAMES_PER_DAY) return Response.json({ error: "daily game limit reached" }, { status: 429 });

  const seed = randomBytes(16).toString("hex");
  const { client, state } = GAMES[game].start(seed, body?.options);
  const [s] = await sql`insert into game_sessions (player_id, game, seed, week_start, state)
                        values (${playerId}, ${game}, ${seed}, ${weekStart()}, ${state === undefined ? null : JSON.stringify(state)}::jsonb) returning id`;
  return Response.json({ id: s.id, ...client });
}
