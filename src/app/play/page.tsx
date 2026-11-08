"use client";
import { useEffect, useRef, useState } from "react";

type Round = { target: string; tiles: string[] };
type Click = { round: number; tile: number; t: number };
const DURATION = 30_000;

export default function Play() {
  const [handle, setHandle] = useState<string | null>(null);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [left, setLeft] = useState(0);
  const [msg, setMsg] = useState("");
  const [x, setX] = useState("");
  const game = useRef<{ id: string; t0: number; clicks: Click[]; timer?: any } | undefined>(undefined);

  useEffect(() => { fetch("/api/auth/me").then((r) => r.json()).then((d) => setHandle(d.x_username)); }, []);

  async function signup() {
    const r = await fetch("/api/auth/signup", { method: "POST", body: JSON.stringify({ xUsername: x }) });
    const d = await r.json();
    if (r.ok) { setHandle(d.x_username); setMsg(""); } else setMsg(d.error);
  }

  async function start() {
    const r = await fetch("/api/game/start", { method: "POST" });
    const d = await r.json();
    if (!r.ok) return setMsg(d.error);
    game.current = { id: d.id, t0: performance.now(), clicks: [] };
    setRounds(d.rounds); setI(0); setScore(0); setMsg("");
    game.current.timer = setInterval(() => {
      const rem = DURATION - (performance.now() - game.current!.t0);
      setLeft(Math.max(0, rem));
      if (rem <= 0) finish();
    }, 100);
  }

  function pick(tile: number) {
    const g = game.current; if (!g || !rounds.length) return;
    g.clicks.push({ round: i, tile, t: Math.round(performance.now() - g.t0) });
    // local score is cosmetic; the server recomputes the real one
    setScore((s) => s + (rounds[i].tiles[tile].startsWith(rounds[i].target) ? 10 : -5));
    setI(i + 1);
  }

  async function finish() {
    const g = game.current; if (!g) return;
    clearInterval(g.timer); game.current = undefined; setRounds([]);
    const r = await fetch("/api/game/finish", { method: "POST", body: JSON.stringify({ id: g.id, clicks: g.clicks }) });
    const d = await r.json();
    setMsg(r.ok ? (d.won ? `🏆 WON! +${d.points} points` : `Score ${d.score} — need 100 to win`) : `Rejected: ${d.error}`);
  }

  const r = rounds[i];
  return (
    <>
      <h1>HashRush</h1>
      {!handle ? (<>
        <p>Your X username (we contact winners there to send the prize; no need to connect your X account):</p>
        <input value={x} onChange={(e) => setX(e.target.value)} placeholder="@yourhandle" style={{ padding: 8, marginRight: 8 }} />
        <button onClick={signup}>Sign up</button>
      </>) : <p>@{handle}</p>}
      {handle && !rounds.length && <button onClick={start}>Start (30s)</button>}
      {r && (<>
        <p>Time {(left / 1000).toFixed(1)}s · Score {score}</p>
        <h2>Find the hash starting with <code style={{ color: "#f0883e" }}>{r.target}</code></h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
          {r.tiles.map((h, k) => <button key={k} onClick={() => pick(k)} style={{ padding: 16, fontFamily: "inherit" }}>{h}</button>)}
        </div>
      </>)}
      <p>{msg}</p>
    </>
  );
}
