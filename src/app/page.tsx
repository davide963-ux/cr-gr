import Link from "next/link";
import { sql } from "@/lib/db";
import { weekStart, nextWeekStart } from "@/lib/weeks";
import { SPLIT } from "@/lib/prizes";
import Countdown from "@/components/Countdown";
import Board from "@/components/Board";
import Room from "@/components/Room";
import GameCards from "@/components/GameCards";
import SidePanel from "@/components/SidePanel";
import ScoreBar from "@/components/ScoreBar";

export const revalidate = 15;

export default async function Home() {
  const week = weekStart();
  let rows: Record<string, any>[] = [];
  try { rows = process.env.DATABASE_URL ? await sql`select * from weekly_leaderboard(${week}::date, 10)` : []; }
  catch (e) { console.error("leaderboard query failed", e); }
  return (
    <>
      <section className="promos">
        <Link href="/#prizes" className="promo p1"><span className="px">TOP 10<br />GET PAID</span><small>$HASHRUSH every Monday</small></Link>
        <div className="promo p2"><span className="px">NEXT PAYOUT</span><Countdown to={nextWeekStart().toISOString()} compact /></div>
        <Link href="/play" className="promo p3"><span className="px">GAMES</span><small>First games coming soon</small></Link>
        <div className="promo p4"><span className="px">GET READY</span><small>Log in with your X username now</small></div>
      </section>

      <section className="cols">
        <SidePanel />
        <div>
          <ScoreBar />
          <div className="roomwrap"><Room /></div>
          <div className="roombar">
            <span className="rl">Games:</span>
            <span className="rb lock">1</span><span className="rb lock">2</span><span className="rb lock">3</span><span className="rb lock">4</span>
            <Link href="/play" className="btn sm neon" style={{ marginLeft: "auto" }}>▶ Games</Link>
          </div>
          <p className="hint">Welcome to HashRush! Log in with your X username, win games to earn points, and climb the weekly leaderboard. The top 10 are paid in $HASHRUSH every Monday.</p>
        </div>
      </section>

      <section className="panel" style={{ marginTop: 18 }}>
        <h2 className="px">GAMES</h2>
        <GameCards />
      </section>

      <section className="two">
        <div className="panel">
          <h2 className="px">TOP 10 THIS WEEK</h2>
          <Board rows={rows} />
          <p style={{ textAlign: "center", marginBottom: 0 }}><Link href="/leaderboard" style={{ color: "var(--cyan)" }}>Full leaderboard →</Link></p>
        </div>
        <div className="grid">
          <div className="panel" id="prizes">
            <h2 className="px">REWARDS</h2>
            <div className="prizes">
              {SPLIT.map((p, i) => <div key={i}><span>{i < 3 ? ["🥇", "🥈", "🥉"][i] + " " : ""}Rank {i + 1}</span><b>{p}%</b></div>)}
            </div>
            <p className="muted">Percent of the weekly $HASHRUSH prize pool.</p>
          </div>
          <div className="panel" id="how">
            <h2 className="px">HOW IT WORKS</h2>
            <ol className="rules">
              <li>Log in with your X username.</li>
              <li>Play the games and win to earn points.</li>
              <li>The week runs Monday–Sunday (UTC). Top 10 get paid on Monday.</li>
            </ol>
          </div>
        </div>
      </section>
    </>
  );
}
