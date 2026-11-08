import { sql } from "@/lib/db";
import { getPlayerId } from "@/lib/auth";
import { scoreSession } from "@/lib/game";

export async function POST(req: Request) {
  const playerId = await getPlayerId();
  if (!playerId) return Response.json({ error: "sign in first" }, { status: 401 });
  const { id, clicks } = await req.json();

  const rows = await sql`select seed, extract(epoch from (now() - started_at)) * 1000 as elapsed
                         from game_sessions where id = ${id} and player_id = ${playerId} and finished_at is null`;
  if (!rows.length) return Response.json({ error: "unknown or already finished" }, { status: 404 });

  const v = scoreSession(rows[0].seed, clicks, Number(rows[0].elapsed));
  const { score, won, points } = v.ok ? v : { score: 0, won: false, points: 0 };
  // `finished_at is null` guard => a session can be scored exactly once
  const upd = await sql`update game_sessions set finished_at = now(), score = ${score}, won = ${won}, points = ${points}
                        where id = ${id} and finished_at is null returning id`;
  if (!upd.length) return Response.json({ error: "already finished" }, { status: 409 });
  return Response.json(v.ok ? { score, won, points } : { error: v.reason }, { status: v.ok ? 200 : 422 });
}
