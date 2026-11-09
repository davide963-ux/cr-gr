"use client";
import Link from "next/link";
import { useMe } from "./useMe";

export default function SidePanel() {
  const me = useMe();
  const used = me?.gamesToday ?? 0;
  return (
    <div className="stack">
      <Link href="/play" className="banner b1 px">GAMES<small>4 GAMES LIVE</small></Link>
      <Link href="/leaderboard" className="banner b2 px">LEADERBOARD<small>TOP 10 GET PAID</small></Link>
      <div className="panel quests">
        <div className="tabs"><span className="on">Today</span><span>This week</span></div>
        {me?.x_username ? (
          <>
            <div className="quest">
              <div className="qic">🎮</div>
              <div className="qtx"><b>Play games</b><div className="qbar"><i style={{ width: `${Math.min(100, used * 4)}%` }} /></div><small>{used} games played today</small></div>
              <Link href="/play" className="btn sm">Start</Link>
            </div>
            <div className="quest">
              <div className="qic">🏆</div>
              <div className="qtx"><b>Win games</b><small>{me.wins ?? 0} wins this week · {(me.points ?? 0).toLocaleString()} pts</small></div>
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
