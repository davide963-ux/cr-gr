"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Round = { target: string; tiles: string[] };
type Click = { round: number; tile: number; t: number };
type Result = { ok: boolean; won?: boolean; score?: number; points?: number; error?: string };
const DURATION = 30_000;
const refresh = () => window.dispatchEvent(new Event("hr:refresh"));

export default function Play() {
  const [handle, setHandle] = useState<string | null | undefined>(undefined); // undefined = loading
  const [x, setX] = useState("");
  const [msg, setMsg] = useState("");
  const [rounds, setRounds] = useState<Round[]>([]);
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [left, setLeft] = useState(DURATION);
  const [last, setLast] = useState<{ v: number; k: number } | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const game = useRef<{ id: string; t0: number; clicks: Click[]; timer?: any } | undefined>(undefined);

  useEffect(() => { fetch("/api/auth/me").then((r) => r.json()).then((d) => setHandle(d.x_username)).catch(() => setHandle(null)); }, []);

  async function login() {
    setBusy(true);
    try {
      const r = await fetch("/api/auth/login", { method: "POST", body: JSON.stringify({ xUsername: x }) });
      const d = await r.json().catch(() => ({}));
      if (r.ok) { setHandle(d.x_username); setMsg(""); refresh(); } else setMsg(d.error ?? `Login failed (${r.status})`);
    } catch { setMsg("Network error, try again"); }
    setBusy(false);
  }

  async function start() {
    setBusy(true); setResult(null); setMsg("");
    const r = await fetch("/api/game/start", { method: "POST" });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setMsg(d.error ?? "Could not start");
    game.current = { id: d.id, t0: performance.now(), clicks: [] };
    setRounds(d.rounds); setI(0); setScore(0); setLeft(DURATION); setLast(null);
    game.current.timer = setInterval(() => {
      const rem = DURATION - (performance.now() - game.current!.t0);
      setLeft(Math.max(0, rem));
      if (rem <= 0) finish();
    }, 100);
  }

  function pick(tile: number) {
    const g = game.current; if (!g || !rounds.length) return;
    g.clicks.push({ round: i, tile, t: Math.round(performance.now() - g.t0) });
    const ok = rounds[i].tiles[tile].startsWith(rounds[i].target); // cosmetic; the server recomputes the real score
    setScore((s) => s + (ok ? 10 : -5)); setLast({ v: ok ? 10 : -5, k: i }); setI(i + 1);
  }

  async function finish() {
    const g = game.current; if (!g) return;
    clearInterval(g.timer); game.current = undefined; setRounds([]);
    const r = await fetch("/api/game/finish", { method: "POST", body: JSON.stringify({ id: g.id, clicks: g.clicks }) });
    const d = await r.json().catch(() => ({}));
    setResult(r.ok ? { ok: true, ...d } : { ok: false, error: d.error ?? "Rejected" });
    refresh();
  }

  const r = rounds[i];
  const playing = rounds.length > 0;
  return (
    <div className="stage">
      <div className="panel">
        <h2 className="px">HASH RUSH</h2>

        {handle === undefined && <div className="empty">Loading…</div>}

        {handle === null && (
          <>
            <p style={{ margin: 0 }}>Log in with your <b>X username</b> to play. We contact winners there to send the prize. You don&apos;t need to connect your X account.</p>
            <input className="field" value={x} onChange={(e) => setX(e.target.value)} onKeyDown={(e) => e.key === "Enter" && login()} placeholder="@yourhandle" autoFocus />
            <button className="btn" onClick={login} disabled={busy}>▶ Log in</button>
          </>
        )}

        {handle && !playing && !result && (
          <div className="result">
            <p>Ready, <b style={{ color: "var(--cyan)" }}>@{handle}</b>?</p>
            <button className="btn" onClick={start} disabled={busy}>▶ Start (30s)</button>
          </div>
        )}

        {playing && r && (
          <>
            <div className="hud">
              <div className="stat"><span>Time</span><b>{(left / 1000).toFixed(1)}s</b></div>
              <div className="stat"><span>Score</span><b>{Math.max(0, score)}</b></div>
              <div className="stat"><span>Last</span><b style={{ color: last ? (last.v > 0 ? "var(--green)" : "var(--red)") : "var(--muted)" }}>{last ? (last.v > 0 ? "+10" : "-5") : "–"}</b></div>
            </div>
            <div className={`bar ${left < 8000 ? "low" : ""}`}><i style={{ width: `${(left / DURATION) * 100}%` }} /></div>
            <div className="target">Find the hash starting with<code>{r.target}</code></div>
            <div className="tiles">
              {r.tiles.map((h, k) => <button key={`${i}-${k}`} className="tile" onClick={() => pick(k)}>{h}</button>)}
            </div>
          </>
        )}

        {result && !playing && (
          <div className="result">
            {result.ok ? (
              <>
                <div className={`big px ${result.won ? "win" : "lose"}`}>{result.won ? "YOU WON!" : "TIME UP"}</div>
                <p>Score <b style={{ color: "var(--gold)" }}>{result.score}</b>{result.won ? <> · <b style={{ color: "var(--green)" }}>+{result.points} points</b> added to the leaderboard</> : <> · you need <b>100</b> to win points</>}</p>
              </>
            ) : <div className="big px lose" style={{ fontSize: 14 }}>{result.error}</div>}
            <button className="btn" onClick={start} disabled={busy}>↻ Play again</button>
          </div>
        )}

        <div className="msg">{msg}</div>
      </div>

      <div className="grid">
        <div className="panel">
          <h2 className="px">HOW IT WORKS</h2>
          <ul className="rules">
            <li>You get 30 seconds.</li>
            <li>Click the hash that starts with the target.</li>
            <li><b style={{ color: "var(--green)" }}>+10</b> correct, <b style={{ color: "var(--red)" }}>−5</b> wrong.</li>
            <li>Score <b>100+</b> = a won game; your score becomes points.</li>
            <li>Top 10 on Monday get paid in $HASHRUSH.</li>
          </ul>
        </div>
        <Link href="/leaderboard" className="btn ghost" style={{ textAlign: "center" }}>🏆 Leaderboard</Link>
      </div>
    </div>
  );
}
