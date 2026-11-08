import { randomBytes } from "node:crypto";
import { sql } from "@/lib/db";
import { getPlayerId } from "@/lib/auth";
import { buildRounds } from "@/lib/game";
import { weekStart } from "@/lib/weeks";

const MAX_GAMES_PER_DAY = 50;

export async function POST() {
  const playerId = await getPlayerId();
  if (!playerId) return Response.json({ error: "sign in first" }, { status: 401 });

  const [{ n }] = await sql`select count(*)::int as n from game_sessions where player_id = ${playerId} and started_at > now() - interval '1 day'`;
  if (n >= MAX_GAMES_PER_DAY) return Response.json({ error: "daily game limit reached" }, { status: 429 });

  const seed = randomBytes(16).toString("hex");
  const [s] = await sql`insert into game_sessions (player_id, game, seed, week_start) values (${playerId}, 'hashrush', ${seed}, ${weekStart()}) returning id`;
  return Response.json({ id: s.id, rounds: buildRounds(seed).rounds }); // answers never leave the server
}
