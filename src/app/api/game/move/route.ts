import { sql } from "@/lib/db";
import { getPlayerId } from "@/lib/auth";
import { GAMES, isGameId } from "@/lib/games";

// One move of a server-authoritative game (Minefield): the server holds the secret state and
// returns only what the move reveals. When the move ends the game, the session is scored here.
export async function POST(req: Request) {
  const playerId = await getPlayerId();
  if (!playerId) return Response.json({ error: "sign in first" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  if (typeof body?.id !== "string") return Response.json({ error: "bad request" }, { status: 400 });

  const rows = await sql`select game, seed, state, extract(epoch from (now() - started_at)) * 1000 as elapsed
                         from game_sessions where id = ${body.id} and player_id = ${playerId} and finished_at is null`;
  const def = rows.length && isGameId(rows[0].game) ? GAMES[rows[0].game] : undefined;
  if (!def?.move) return Response.json({ error: "unknown or already finished" }, { status: 404 });

  const out = def.move(rows[0].seed, rows[0].state, body, Number(rows[0].elapsed));
  if ("error" in out) return Response.json({ error: out.error }, { status: 422 });

  // optimistic lock on the move counter: two racing clicks can't both apply
  const n = Number(rows[0].state?.n ?? 0), st = JSON.stringify(out.state), v = out.verdict;
  const upd = v
    ? await sql`update game_sessions set state = ${st}::jsonb, finished_at = now(), score = ${v.ok ? v.score : 0}, won = ${v.ok && v.won}, points = ${v.ok ? v.points : 0}
                where id = ${body.id} and finished_at is null and (state->>'n')::int = ${n} returning id`
    : await sql`update game_sessions set state = ${st}::jsonb
                where id = ${body.id} and finished_at is null and (state->>'n')::int = ${n} returning id`;
  if (!upd.length) return Response.json({ error: "move conflict, try again" }, { status: 409 });
  return Response.json(out.reply);
}
