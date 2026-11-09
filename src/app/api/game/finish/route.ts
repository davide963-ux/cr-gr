import { sql } from "@/lib/db";
import { getPlayerId } from "@/lib/auth";
import { GAMES, isGameId } from "@/lib/games";

export async function POST(req: Request) {
  const playerId = await getPlayerId();
  if (!playerId) return Response.json({ error: "sign in first" }, { status: 401 });
  const body = await req.json().catch(() => ({}));

  const rows = await sql`select game, seed, extract(epoch from (now() - started_at)) * 1000 as elapsed
                         from game_sessions where id = ${body.id} and player_id = ${playerId} and finished_at is null`;
  if (!rows.length || !isGameId(rows[0].game)) return Response.json({ error: "unknown or already finished" }, { status: 404 });

  const v = GAMES[rows[0].game as keyof typeof GAMES].finish(rows[0].seed, body, Number(rows[0].elapsed));
  const { score, won, points } = v.ok ? v : { score: 0, won: false, points: 0 };
  // `finished_at is null` guard => a session can be scored exactly once
  const upd = await sql`update game_sessions set finished_at = now(), score = ${score}, won = ${won}, points = ${points}
                        where id = ${body.id} and finished_at is null returning id`;
  if (!upd.length) return Response.json({ error: "already finished" }, { status: 409 });
  return Response.json(v.ok ? { score, won, points } : { error: v.reason }, { status: v.ok ? 200 : 422 });
}
