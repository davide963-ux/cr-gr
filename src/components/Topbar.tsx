"use client";
import Link from "next/link";
import Icon from "./Icon";
import { useMe } from "./useMe";

const ord = (n: number) => { const s = ["th", "st", "nd", "rd"], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); };

export default function Topbar() {
  const me = useMe();
  async function logout() { await fetch("/api/auth/logout", { method: "POST" }); window.dispatchEvent(new Event("hr:refresh")); }
  return (
    <header className="top">
      <Link href="/" className="logo px">HASH<b>RUSH</b></Link>
      <div className="top-r">
        {me?.x_username ? (
          <>
            <div className="pill" title="Points this week"><span className="coin"><Icon name="coin" size={18} /></span><b>{(me.points ?? 0).toLocaleString()}</b><small>PTS</small></div>
            <button className="pill ghostp" onClick={logout} title="Log out">Exit <Icon name="chevron" size={14} /></button>
            <div className="prof">
              <div className="ava px">{me.x_username[0].toUpperCase()}</div>
              <div><b>@{me.x_username}</b><small>{me.rank ? `${ord(me.rank)} / ${me.players ?? "–"}` : "unranked"}</small></div>
            </div>
          </>
        ) : me === undefined ? null : <Link href="/play" className="btn sm">Log in</Link>}
      </div>
    </header>
  );
}
