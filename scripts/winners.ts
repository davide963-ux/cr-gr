// Usage: npm run winners [YYYY-MM-DD] [--record]
// Prints the top 10 of a finished week (default: last week) with suggested prize amounts,
// as a table + CSV. --record stores the rows in weekly_payouts so you can track what you paid.
import { sql } from "../src/lib/db";
import { previousWeekStart } from "../src/lib/weeks";

const SPLIT = [30, 20, 15, 10, 8, 6, 4, 3, 2, 2]; // % per rank, edit freely
const week = process.argv.find((a) => /^\d{4}-\d{2}-\d{2}$/.test(a)) ?? previousWeekStart();
const pool = Number(process.env.WEEKLY_PRIZE_POOL ?? 0);

const top = await sql`select * from weekly_leaderboard(${week}::date, 10)`;
const plan = top.map((r) => ({ rank: Number(r.rank), wallet: r.wallet as string, points: Number(r.points),
  wins: Number(r.wins), amount: (pool * SPLIT[Number(r.rank) - 1]) / 100 }));

console.log(`Week starting ${week} — pool ${pool} $HASHRUSH`);
console.table(plan);
console.log("rank,wallet,amount\n" + plan.map((p) => `${p.rank},${p.wallet},${p.amount}`).join("\n"));

if (process.argv.includes("--record")) {
  for (const p of plan)
    await sql`insert into weekly_payouts (week_start, rank, wallet, points, amount)
              values (${week}, ${p.rank}, ${p.wallet}, ${p.points}, ${p.amount}) on conflict (week_start, rank) do nothing`;
  console.log("recorded (status=pending). After sending:\n  update weekly_payouts set status='sent', tx_signature='<sig>' where week_start='" + week + "' and rank=<n>;");
}
