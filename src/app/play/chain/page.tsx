"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import LoginBox from "@/components/LoginBox";
import { useMe } from "@/components/useMe";

const STEP = 700, LIT = 400, PAUSE = 600, MAX = 20, WIN = 7, PER = 15;
const LABELS = ["A", "3", "F", "0"];
type Result = { ok: boolean; won?: boolean; score?: number; points?: number; error?: string };
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const refresh = () => window.dispatchEvent(new Event("hr:refresh"));

export default function Chain() {
  const me = useMe();
  const handle = me === undefined ? undefined : me.x_username;
  const [phase, setPhase] = useState<"idle" | "show" | "input" | "over">("idle");
  const [level, setLevel] = useState(0);        // current sequence length
  const [done, setDone] = useState(0);          // completed levels
  const [lit, setLit] = useState<number | null>(null);
  const [pos, setPos] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const g = useRef<{ id: string; seq: number[]; presses: number[]; run: number } | undefined>(undefined);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; if (g.current) g.current.run = -1; }; }, []);

  async function start() {
    setBusy(true); setResult(null); setMsg("");
    const r = await fetch("/api/game/start", { method: "POST", body: JSON.stringify({ game: "chain" }) });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setMsg(d.error ?? "Could not start");
    g.current = { id: d.id, seq: d.sequence, presses: [], run: Date.now() };
    setDone(0); setPos(0);
    showLevel(1, g.current.run);
  }

  async function showLevel(L: number, run: number) {
    const s = g.current; if (!s) return;
    setLevel(L); setPos(0); setPhase("show");
    await sleep(PAUSE);
    for (let i = 0; i < L; i++) {
      if (!alive.current || s.run !== run) return;
      setLit(s.seq[i]); await sleep(LIT); setLit(null); await sleep(STEP - LIT);
    }
    if (!alive.current || s.run !== run) return;
    setPhase("input");
  }

  async function press(p: number) {
    const s = g.current; if (!s || phase !== "input") return;
    s.presses.push(p);
    setLit(p); setTimeout(() => setLit(null), 150);
    if (p !== s.seq[pos]) return finish(done);            // mistake
    if (pos + 1 === level) {                              // level cleared
      const nd = done + 1; setDone(nd);
      if (nd >= MAX) return finish(nd);
      setPhase("show"); setPos(0);
      const run = s.run;
      await sleep(500);
      if (alive.current && s.run === run) showLevel(level + 1, run);
    } else setPos(pos + 1);
  }

  async function finish(_levels: number) {
    const s = g.current; if (!s) return;
    g.current = undefined; setPhase("over");
    const r = await fetch("/api/game/finish", { method: "POST", body: JSON.stringify({ id: s.id, presses: s.presses }) });
    const d = await r.json().catch(() => ({}));
    setResult(r.ok ? { ok: true, ...d } : { ok: false, error: d.error ?? "Rejected" });
    refresh();
  }

  const playing = phase === "show" || phase === "input";
  return (
    <div className="stage">
      <div className="panel">
        <h2 className="px">CHAIN MEMORY</h2>

        {handle === undefined && <div className="empty">Loading…</div>}
        {handle === null && <LoginBox />}

        {handle && !playing && !result && (
          <div className="result">
            <p>Ready, <b style={{ color: "var(--cyan)" }}>@{handle}</b>? Watch the blocks, then repeat them.</p>
            <button className="btn" onClick={start} disabled={busy}>▶ Start</button>
          </div>
        )}

        {handle && (playing || result) && (
          <>
            <div className="hud">
              <div className="stat"><span>Level</span><b>{Math.min(level, MAX)}</b></div>
              <div className="stat"><span>Cleared</span><b>{done}</b></div>
              <div className="stat"><span>Score</span><b>{done * PER}</b></div>
            </div>
            <div className="target" data-testid="status">{phase === "show" ? "Watch the sequence…" : phase === "input" ? `Your turn: ${pos + 1} / ${level}` : ""}</div>
            <div className="pads">
              {[0, 1, 2, 3].map((p) => (
                <button key={p} className={`pad pad${p} ${lit === p ? "lit" : ""}`} data-pad={p} data-lit={lit === p} onClick={() => press(p)} disabled={phase !== "input"}>{LABELS[p]}</button>
              ))}
            </div>
          </>
        )}

        {result && phase === "over" && (
          <div className="result">
            {result.ok ? (
              <>
                <div className={`big px ${result.won ? "win" : "lose"}`}>{result.won ? "YOU WON!" : "GAME OVER"}</div>
                <p>Cleared <b style={{ color: "var(--gold)" }}>{(result.score ?? 0) / PER}</b> levels · score <b style={{ color: "var(--gold)" }}>{result.score}</b>{result.won ? <> · <b style={{ color: "var(--green)" }}>+{result.points} points</b> added to the leaderboard</> : <> · clear <b>{WIN}</b> levels to win points</>}</p>
              </>
            ) : <div className="big px lose" style={{ fontSize: 18 }}>{result.error}</div>}
            <button className="btn" onClick={start} disabled={busy}>↻ Play again</button>
          </div>
        )}
        <div className="msg">{msg}</div>
      </div>

      <div className="grid">
        <div className="panel">
          <h2 className="px">HOW IT WORKS</h2>
          <ul className="rules">
            <li>Watch the blocks light up in order.</li>
            <li>Repeat the sequence; each level adds one block.</li>
            <li><b style={{ color: "var(--green)" }}>+{PER}</b> points per cleared level. One mistake ends the game.</li>
            <li>Clear <b>{WIN}+</b> levels = a won game; your score becomes points.</li>
            <li>Top 10 on Monday get paid in $HASHRUSH.</li>
          </ul>
        </div>
        <Link href="/play" className="btn ghost" style={{ textAlign: "center" }}>← All games</Link>
      </div>
    </div>
  );
}
