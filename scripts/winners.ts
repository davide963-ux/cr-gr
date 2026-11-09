// Usage: npm run winners [YYYY-MM-DD] [--record]
// Prints the top 10 of a finished week (default: last week) with contact details and suggested prize amounts.
// --record stores the rows in weekly_payouts so you can track what you paid.
import { sql } from "../src/lib/db";
import { previousWeekStart } from "../src/lib/weeks";

import { SPLIT } from "../src/lib/prizes";
const week = process.argv.find((a) => /^\d{4}-\d{2}-\d{2}$/.test(a)) ?? previousWeekStart();
const pool = Number(process.env.WEEKLY_PRIZE_POOL ?? 0);

const top = await sql`select * from weekly_leaderboard(${week}::date, 10)`;
const plan = top.map((r) => ({ rank: Number(r.rank), x: "@" + r.x_username, points: Number(r.points),
  wins: Number(r.wins), amount: (pool * SPLIT[Number(r.rank) - 1]) / 100 }));

console.log(`Week starting ${week} — pool ${pool} $HASHRUSH`);
console.table(plan);
console.log("rank,x,amount\n" + plan.map((p) => `${p.rank},${p.x},${p.amount}`).join("\n"));

if (process.argv.includes("--record")) {
  for (const p of plan)
    await sql`insert into weekly_payouts (week_start, rank, x_username, points, amount)
              values (${week}, ${p.rank}, ${p.x.slice(1)}, ${p.points}, ${p.amount}) on conflict (week_start, rank) do nothing`;
  console.log("recorded (status=pending). After sending:\n  update weekly_payouts set status='sent', tx_signature='<sig>' where week_start='" + week + "' and rank=<n>;");
}
