import { sql } from "@/lib/db";
import { getPlayerId } from "@/lib/auth";
import { weekStart } from "@/lib/weeks";

export async function GET() {
  const id = await getPlayerId();
  if (!id) return Response.json({ x_username: null });
  const p = await sql`select x_username from players where id = ${id}`;
  if (!p.length) return Response.json({ x_username: null });
  const [lb] = await sql`select rank, points, wins from weekly_leaderboard(${weekStart()}::date, 100000) where lower(x_username) = lower(${p[0].x_username})`;
  const [today] = await sql`select count(*)::int as n from game_sessions where player_id = ${id} and started_at > now() - interval '1 day'`;
  const [tot] = await sql`select count(*)::int as n from players`;
  return Response.json({
    x_username: p[0].x_username,
    points: Number(lb?.points ?? 0), wins: Number(lb?.wins ?? 0), rank: lb ? Number(lb.rank) : null,
    gamesToday: today.n, dailyLimit: 50, players: tot.n,
  });
}
