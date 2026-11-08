import { sql } from "@/lib/db";
import { weekStart } from "@/lib/weeks";

export const revalidate = 15; // cache 15s on Vercel
export async function GET(req: Request) {
  const week = new URL(req.url).searchParams.get("week") ?? weekStart();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(week)) return Response.json({ error: "bad week" }, { status: 400 });
  const rows = await sql`select * from weekly_leaderboard(${week}::date, 100)`;
  return Response.json({ week, rows });
}
