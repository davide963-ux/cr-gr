import { sql } from "@/lib/db";
import { getPlayerId } from "@/lib/auth";
import { weekStart } from "@/lib/weeks";

export async function GET() {
  const id = await getPlayerId();
  if (!id) return Response.json({ x_username: null });
  const p = await sql`select x_username from players where id = ${id}`;
  if (!p.length) return Response.json({ x_username: null });
  const lb = await sql`select rank, points from weekly_leaderboard(${weekStart()}::date, 1000) where lower(x_username) = lower(${p[0].x_username})`;
  return Response.json({ x_username: p[0].x_username, points: Number(lb[0]?.points ?? 0), rank: lb[0] ? Number(lb[0].rank) : null });
}
