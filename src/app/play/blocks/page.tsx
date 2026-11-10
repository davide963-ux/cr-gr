"use client";
import { useEffect, useRef, useState } from "react";
import { Shell, StartCard, Overlay, post, toResult, refreshMe, useTicker, ctx2d, type Result } from "@/components/GameShell";
import { Tetris, cellsOf, COLS, ROWS, A } from "@/lib/games/tetris";

const S = 24, COLORS = ["#17e8e8", "#ffd24a", "#8a5cff", "#3ddc84", "#ff5470", "#4a7dff", "#ff9a1f"];
const KEYS: Record<string, number> = { ArrowLeft: A.LEFT, ArrowRight: A.RIGHT, ArrowUp: A.ROTATE, x: A.ROTATE, ArrowDown: A.SOFT, " ": A.HARD };

function block(c: CanvasRenderingContext2D, x: number, y: number, color: string, s = S) {
  c.fillStyle = color; c.fillRect(x * s + 1, y * s + 1, s - 2, s - 2);
  c.fillStyle = "rgba(255,255,255,.25)"; c.fillRect(x * s + 1, y * s + 1, s - 2, 4);
}

function Game() {
  const [phase, setPhase] = useState<"idle" | "play" | "over">("idle");
  const [hud, setHud] = useState({ score: 0, lines: 0, speed: 1 });
  const [result, setResult] = useState<Result | null>(null);
  const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false);
  const cv = useRef<HTMLCanvasElement>(null), nx = useRef<HTMLCanvasElement>(null);
  const run = useRef<{ id: string; g: Tetris; log: number[]; pending: number[]; held: Record<number, number> } | null>(null);
  const last = useRef<Tetris | null>(null); // keeps the final board on screen after the game ends

  async function start() {
    setBusy(true); setMsg(""); setResult(null);
    const r = await post("/api/game/start", { game: "blocks" });
    setBusy(false);
    if (!r.ok) return setMsg(r.d.error ?? "Could not start");
    run.current = { id: r.d.id, g: new Tetris(r.d.seed), log: [], pending: [], held: {} };
    last.current = run.current.g;
    setPhase("play");
  }
  async function finish() {
    const r = run.current; if (!r) return;
    run.current = null; setPhase("over");
    setResult(toResult(await post("/api/game/finish", { id: r.id, log: r.log, ticks: r.g.tick })));
    refreshMe();
  }
  const down = (a: number) => { const r = run.current; if (!r) return; r.pending.push(a); if (a === A.LEFT || a === A.RIGHT || a === A.SOFT) r.held[a] = 0; };
  const up = (a: number) => { if (run.current) delete run.current.held[a]; };

  useEffect(() => {
    if (phase !== "play") return;
    const kd = (e: KeyboardEvent) => { const a = KEYS[e.key]; if (a === undefined) return; e.preventDefault(); if (!e.repeat) down(a); };
    const ku = (e: KeyboardEvent) => { const a = KEYS[e.key]; if (a !== undefined) up(a); };
    window.addEventListener("keydown", kd); window.addEventListener("keyup", ku);
    return () => { window.removeEventListener("keydown", kd); window.removeEventListener("keyup", ku); };
  }, [phase]);

  useTicker(phase !== "idle", () => {
    const r = run.current; if (!r || r.g.over) return;
    const acts = r.pending.splice(0, 8);
    for (const a of [A.LEFT, A.RIGHT]) if (a in r.held && ++r.held[a] >= 10 && (r.held[a] - 10) % 3 === 0) acts.push(a); // auto-repeat
    if (A.SOFT in r.held && ++r.held[A.SOFT] % 3 === 0) acts.push(A.SOFT);
    acts.length = Math.min(acts.length, 8);
    for (const a of acts) r.log.push(r.g.tick, a);
    r.g.step(acts);
    if (r.g.over) finish();
  }, () => {
    const g = last.current, c = ctx2d(cv.current, COLS * S, ROWS * S); if (!g || !c) return;
    c.fillStyle = "#0c0c2c"; c.fillRect(0, 0, COLS * S, ROWS * S);
    c.fillStyle = "rgba(255,255,255,.04)";
    for (let x = 1; x < COLS; x++) c.fillRect(x * S, 0, 1, ROWS * S);
    for (let y = 1; y < ROWS; y++) c.fillRect(0, y * S, COLS * S, 1);
    for (let i = 0; i < g.grid.length; i++) if (g.grid[i]) block(c, i % COLS, Math.floor(i / COLS), COLORS[g.grid[i] - 1]);
    const gy = g.ghostY();
    c.strokeStyle = "rgba(255,255,255,.35)";
    for (const [dx, dy] of cellsOf(g.type, g.rot)) c.strokeRect((g.x + dx) * S + 2.5, (gy + dy) * S + 2.5, S - 5, S - 5);
    for (const [dx, dy] of cellsOf(g.type, g.rot)) if (g.y + dy >= 0) block(c, g.x + dx, g.y + dy, COLORS[g.type]);
    const n = ctx2d(nx.current, 80, 80);
    if (n) { n.fillStyle = "#0c0c2c"; n.fillRect(0, 0, 80, 80); for (const [dx, dy] of cellsOf(g.next[0], 0)) block(n, dx + 0.2, dy + 0.6, COLORS[g.next[0]], 18); }
    const speed = g.level + 1;
    setHud((h) => (h.score === g.score && h.lines === g.lines && h.speed === speed ? h : { score: g.score, lines: g.lines, speed }));
  });

  const pad = (label: string, a: number) => (
    <button className="tbtn" onPointerDown={(e) => { e.preventDefault(); down(a); }} onPointerUp={() => up(a)} onPointerLeave={() => up(a)} aria-label={label}>{label}</button>
  );
  return (
    <>
      {phase === "idle" && <StartCard id="blocks" name="Block Stack" text="Stack the blocks and clear lines. No timer: the longer you last, the faster they fall." onStart={start} busy={busy} />}
      {phase !== "idle" && (
        <div className="tetris">
          <div className="boardwrap" style={{ width: `min(380px, calc(100% - 150px), calc((100vh - 250px) * ${COLS / ROWS}))`, minWidth: 170 }}>
            <canvas ref={cv} className="board" style={{ width: "100%", aspectRatio: `${COLS} / ${ROWS}` }} />
            {phase === "over" && <Overlay result={result} hint="you need 60 to win points" onAgain={start} busy={busy} />}
          </div>
          <div className="tside">
            <div className="stat"><span>Next</span><canvas ref={nx} style={{ width: 96, height: 96 }} /></div>
            <div className="stat"><span>Score</span><b>{hud.score}</b></div>
            <div className="stat"><span>Lines</span><b>{hud.lines}</b></div>
            <div className="stat"><span>Speed</span><b>×{hud.speed}</b></div>
          </div>
        </div>
      )}
      {phase === "play" && <div className="tpad">{pad("◀", A.LEFT)}{pad("⟳", A.ROTATE)}{pad("▶", A.RIGHT)}{pad("▼", A.SOFT)}{pad("⤓", A.HARD)}</div>}
      <div className="msg">{msg}</div>
    </>
  );
}

export default function Page() {
  return (
    <Shell id="blocks" title="BLOCK STACK" rules={<>
      <li>Move with <b>← →</b>, rotate with <b>↑</b>, soft drop <b>↓</b>, hard drop <b>Space</b> (or the on-screen buttons).</li>
      <li>Clear 1 / 2 / 3 / 4 lines at once for <b>20 / 50 / 80 / 120</b>.</li>
      <li>No timer. Blocks fall faster every <b>15 seconds</b>; play until the stack reaches the top.</li>
      <li>Score <b>60+</b> = a won game; your score becomes points.</li>
    </>}>{() => <Game />}</Shell>
  );
}
