import Link from "next/link";
import { sql } from "@/lib/db";
import { weekStart, nextWeekStart } from "@/lib/weeks";
import { SPLIT } from "@/lib/prizes";
import Countdown from "@/components/Countdown";
import Board from "@/components/Board";

export const revalidate = 15;

const SOON = [
  { name: "NONCE HUNTER", icon: "⛏", bg: "linear-gradient(135deg,#3b2a7a,#1a1a4d)" },
  { name: "BLOCK STACK", icon: "▦", bg: "linear-gradient(135deg,#0f4d6b,#1a1a4d)" },
  { name: "CHAIN DASH", icon: "⚡", bg: "linear-gradient(135deg,#6b2a4d,#1a1a4d)" },
];

export default async function Home() {
  const week = weekStart();
  let rows: Record<string, any>[] = [];
  try { rows = process.env.DATABASE_URL ? await sql`select * from weekly_leaderboard(${week}::date, 10)` : []; }
  catch (e) { console.error("leaderboard query failed", e); }
  return (
    <>
      <section className="hero">
        <div className="panel">
          <h1 className="px">PLAY. WIN.<br /><em>GET PAID.</em></h1>
          <p>Win games, earn points and climb the weekly leaderboard. The top 10 players get rewarded in <b style={{ color: "var(--orange)" }}>$HASHRUSH</b> every Monday.</p>
          <Link href="/play" className="btn">▶ Play now</Link>
        </div>
        <div className="panel">
          <h2 className="px">NEXT PAYOUT IN</h2>
          <Countdown to={nextWeekStart().toISOString()} />
          <p style={{ marginTop: 14, fontSize: 16, marginBottom: 0 }}>Week closes Monday 00:00 UTC. Winners are contacted on X.</p>
        </div>
      </section>

      <section className="panel" style={{ marginTop: 20 }}>
        <h2 className="px">GAMES</h2>
        <div className="games">
          <Link href="/play" className="game live">
            <span className="tag live px">LIVE</span>
            <div className="thumb" style={{ background: "linear-gradient(135deg,#ff9a1f,#8a5cff)", color: "#fff", textShadow: "0 4px 0 rgba(0,0,0,.3)" }}>#A3F</div>
            <div className="body"><div className="name">HASH RUSH</div><div className="meta">Find the matching hash in 30s. Score 100+ to win points.</div><span className="btn sm" style={{ textAlign: "center" }}>Play</span></div>
          </Link>
          {SOON.map((g) => (
            <div key={g.name} className="game locked">
              <span className="tag px">SOON</span>
              <div className="thumb" style={{ background: g.bg }}>{g.icon}</div>
              <div className="body"><div className="name">{g.name}</div><div className="meta">Coming soon</div></div>
            </div>
          ))}
        </div>
      </section>

      <section className="two">
        <div className="panel">
          <h2 className="px">TOP 10 THIS WEEK</h2>
          <Board rows={rows} />
          <p style={{ textAlign: "center", marginBottom: 0 }}><Link href="/leaderboard" style={{ color: "var(--cyan)" }}>Full leaderboard →</Link></p>
        </div>
        <div className="panel" id="prizes">
          <h2 className="px">REWARDS</h2>
          <div className="prizes">
            {SPLIT.map((p, i) => <div key={i}><span>{i < 3 ? ["🥇", "🥈", "🥉"][i] + " " : ""}Rank {i + 1}</span><b>{p}%</b></div>)}
          </div>
          <p style={{ color: "var(--muted)", fontSize: 16, marginBottom: 0 }}>Percent of the weekly $HASHRUSH prize pool.</p>
        </div>
      </section>
    </>
  );
}
