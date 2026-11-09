import Link from "next/link";
import { CATALOG } from "@/lib/games";

export default function GameCards() {
  if (!CATALOG.length) return <div className="empty"><span className="px" style={{ fontSize: 22, color: "var(--cyan)" }}>NEW GAMES COMING SOON</span><br />We&apos;re building the first games. Log in now so you&apos;re ready when they drop.</div>;
  return (
    <div className="games">
      {CATALOG.map((g) => {
        const inner = (
          <>
            <span className={`tag px ${g.live ? "live" : ""}`}>{g.live ? "LIVE" : "SOON"}</span>
            <div className="thumb px" style={{ background: g.bg }}>{g.icon}</div>
            <div className="body"><div className="name px">{g.name}</div><div className="meta">{g.desc}</div>{g.live && <span className="btn sm">Play</span>}</div>
          </>
        );
        return g.live
          ? <Link key={g.id} href={g.href} className="game live">{inner}</Link>
          : <div key={g.id} className="game locked">{inner}</div>;
      })}
    </div>
  );
}
