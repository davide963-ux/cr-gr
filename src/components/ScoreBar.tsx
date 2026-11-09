"use client";
import Link from "next/link";
import { useMe } from "./useMe";

export default function ScoreBar() {
  const me = useMe();
  return (
    <div className="power">
      <div className="pbadge px">#A3F</div>
      <div className="pinfo">
        <b className="px">{me?.x_username ? `@${me.x_username}` : "MY SCORE"}</b>
        <div>{me?.x_username
          ? <>Week: <b>{(me.points ?? 0).toLocaleString()} pts</b> | Wins: <b>{me.wins ?? 0}</b> | Rank: <b>{me.rank ? `#${me.rank}` : "–"}</b></>
          : "Log in with your X username to start scoring"}</div>
      </div>
      <Link href="/play" className="btn neon">{me?.x_username ? "Play now" : "Log in"}</Link>
    </div>
  );
}
