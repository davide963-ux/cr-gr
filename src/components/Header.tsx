"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

type Me = { x_username: string | null; points?: number; rank?: number | null };

export default function Header() {
  const [me, setMe] = useState<Me | null>(null);
  const load = () => fetch("/api/auth/me").then((r) => r.json()).then(setMe).catch(() => setMe({ x_username: null }));
  useEffect(() => { load(); window.addEventListener("hr:refresh", load); return () => window.removeEventListener("hr:refresh", load); }, []);
  async function logout() { await fetch("/api/auth/logout", { method: "POST" }); window.dispatchEvent(new Event("hr:refresh")); }
  return (
    <header className="hdr">
      <div className="hdr-in">
        <Link href="/" className="logo px">HASH<b>RUSH</b></Link>
        <nav className="nav"><Link href="/">Games</Link><Link href="/leaderboard">Leaderboard</Link><Link href="/#prizes">Prizes</Link></nav>
        {me?.x_username ? (
          <div className="chip">
            <div>@{me.x_username}<br /><small>Week: <span className="pts">{me.points ?? 0} pts</span>{me.rank ? ` · #${me.rank}` : ""}</small></div>
            <button className="btn sm ghost" onClick={logout}>Exit</button>
          </div>
        ) : <Link href="/play" className="btn sm">Log in</Link>}
      </div>
    </header>
  );
}
