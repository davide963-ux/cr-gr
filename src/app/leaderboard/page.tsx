import { sql } from "@/lib/db";
import { weekStart, previousWeekStart } from "@/lib/weeks";
import Board from "@/components/Board";

export const revalidate = 15;

async function rows(week: string) {
  try { return process.env.DATABASE_URL ? await sql`select * from weekly_leaderboard(${week}::date, 100)` : []; } catch { return []; }
}
export default async function Leaderboard() {
  const [now, prev] = await Promise.all([rows(weekStart()), rows(previousWeekStart())]);
  return (
    <div className="two" style={{ marginTop: 28 }}>
      <div className="panel"><h2 className="px">THIS WEEK</h2><Board rows={now} /></div>
      <div className="panel"><h2 className="px">LAST WEEK</h2><Board rows={prev.slice(0, 10)} prizes={false} /></div>
    </div>
  );
}
