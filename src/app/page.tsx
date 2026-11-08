import Link from "next/link";
import { sql } from "@/lib/db";
import { weekStart } from "@/lib/weeks";

export const revalidate = 15;
export default async function Home() {
  const week = weekStart();
  const rows = process.env.DATABASE_URL ? await sql`select * from weekly_leaderboard(${week}::date, 10)` : [];
  const next = new Date(week + "T00:00:00Z"); next.setUTCDate(next.getUTCDate() + 7);
  return (
    <>
      <h1>⚡ HashRush</h1>
      <p>Win games → earn points → top 10 on Monday get paid in $HASHRUSH.</p>
      <p>Payout: <b>{next.toUTCString()}</b></p>
      <Link href="/play" style={{ color: "#58a6ff" }}>▶ Play HashRush</Link>
      <h2>This week&apos;s top 10</h2>
      <ol>{rows.map((r) => <li key={String(r.x_username)}>@{r.x_username} — {String(r.points)} pts ({String(r.wins)} wins)</li>)}</ol>
      {!rows.length && <p>No scores yet. Be first.</p>}
    </>
  );
}
