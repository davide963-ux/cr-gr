"use client";
import Link from "next/link";
import { useMe } from "./useMe";

export default function SidePanel() {
  const me = useMe();
  const used = me?.gamesToday ?? 0, limit = me?.dailyLimit ?? 50;
  return (
    <div className="stack">
      <Link href="/play" className="banner b1 px">HASH RUSH<small>LIVE NOW</small></Link>
      <Link href="/leaderboard" className="banner b2 px">LEADERBOARD<small>TOP 10 GET PAID</small></Link>
      <div className="panel quests">
        <div className="tabs"><span className="on">Today</span><span>This week</span></div>
        {me?.x_username ? (
          <>
            <div className="quest">
              <div className="qic">🎮</div>
              <div className="qtx"><b>Play Hash Rush</b><div className="qbar"><i style={{ width: `${Math.min(100, (used / limit) * 100)}%` }} /></div><small>{used} / {limit} games today</small></div>
              <Link href="/play" className="btn sm">Start</Link>
            </div>
            <div className="quest">
              <div className="qic">🏆</div>
              <div className="qtx"><b>Win games (100+ score)</b><small>{me.wins ?? 0} wins this week · {(me.points ?? 0).toLocaleString()} pts</small></div>
              <Link href="/play" className="btn sm">Start</Link>
            </div>
          </>
        ) : (
          <div className="quest"><div className="qtx"><b>Log in with your X username</b><small>to track your points and rank</small></div><Link href="/play" className="btn sm">Log in</Link></div>
        )}
        <Link href="/leaderboard" className="more">FULL LEADERBOARD ›</Link>
      </div>
    </div>
  );
}
