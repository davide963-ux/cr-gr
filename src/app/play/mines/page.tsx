"use client";
import { useEffect, useRef, useState } from "react";
import { Shell, ResultCard, post, refreshMe, type Result } from "@/components/GameShell";

type Info = { id: string; rows: number; cols: number; mask: string; mines: number; limitMs: number; map: string; level: string };
const LEVELS = [["easy", "EASY", "9×9 · 2 min · 100+ pts"], ["medium", "MEDIUM", "12×12 · 4 min · 220+ pts"], ["hard", "HARD", "16×16 · 7 min · 400+ pts"]];
const NUM = ["", "#17e8e8", "#3ddc84", "#ff5470", "#8a5cff", "#ff9a1f", "#ffd24a", "#fff", "#cfd6ea"];

function Game() {
  const [info, setInfo] = useState<Info | null>(null);
  const [open, setOpen] = useState<Record<number, number>>({});
  const [flags, setFlags] = useState<Record<number, boolean>>({});
  const [mines, setMines] = useState<number[] | null>(null);
  const [boom, setBoom] = useState<number | null>(null);
  const [flagMode, setFlagMode] = useState(false);
  const [left, setLeft] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false);
  const t0 = useRef(0), sending = useRef(false);
  const over = !!result;

  async function start(level: string) {
    setBusy(true); setMsg("");
    const r = await post("/api/game/start", { game: "mines", options: { level } });
    setBusy(false);
    if (!r.ok) return setMsg(r.d.error ?? "Could not start");
    t0.current = Date.now();
    setInfo(r.d); setOpen({}); setFlags({}); setMines(null); setBoom(null); setResult(null); setLeft(Math.ceil(r.d.limitMs / 1000));
  }
  useEffect(() => {
    if (!info || over) return;
    const id = setInterval(() => setLeft(Math.max(0, Math.ceil((info.limitMs - (Date.now() - t0.current)) / 1000))), 250);
    return () => clearInterval(id);
  }, [info, over]);

  async function click(i: number) {
    if (!info || over || sending.current || i in open) return;
    if (flagMode) return setFlags((f) => ({ ...f, [i]: !f[i] }));
    if (flags[i]) return;
    sending.current = true;                       // one move at a time: the server holds the board
    const r = await post("/api/game/move", { id: info.id, cell: i });
    sending.current = false;
    if (!r.ok) return setMsg(r.d.error ?? "Move failed");
    setMsg("");
    setOpen((o) => { const n = { ...o }; for (const [c, v] of r.d.cells as [number, number][]) n[c] = v; return n; });
    if (r.d.over) {
      setMines(r.d.mines ?? []); setBoom(r.d.boom ?? null);
      setResult({ ok: true, won: r.d.won, score: r.d.score, points: r.d.points, error: r.d.timeUp ? "time" : undefined });
      refreshMe();
    }
  }
  const flag = (e: React.MouseEvent, i: number) => { e.preventDefault(); if (!over && !(i in open)) setFlags((f) => ({ ...f, [i]: !f[i] })); };

  if (!info) return (
    <div className="result">
      <p>Pick a difficulty. Open every safe square before the clock runs out.</p>
      <div className="lvls">{LEVELS.map(([id, name, d]) => <button key={id} className="btn" onClick={() => start(id)} disabled={busy}>{name}<small>{d}</small></button>)}</div>
      <div className="msg">{msg}</div>
    </div>
  );
  const nFlags = Object.values(flags).filter(Boolean).length;
  return (
    <>
      <div className="hud">
        <div className="stat"><span>Mines</span><b>{Math.max(0, info.mines - nFlags)}</b></div>
        <div className="stat"><span>Time</span><b>{left}s</b></div>
        <div className="stat"><span>Map</span><b style={{ textTransform: "uppercase" }}>{info.map}</b></div>
        <button className={`btn sm ${flagMode ? "" : "ghost"}`} onClick={() => setFlagMode(!flagMode)} title="Flag mode (or right-click a square)">⚑ {flagMode ? "ON" : "OFF"}</button>
      </div>
      <div className="mgrid" style={{ gridTemplateColumns: `repeat(${info.cols}, 1fr)`, maxWidth: info.cols * 34 }} data-over={over}>
        {info.mask.split("").map((on, i) => {
          if (on === "0") return <span key={i} />;
          const isMine = mines?.includes(i), v = open[i];
          return (
            <button key={i} data-cell={i} className={`mc ${i in open ? "open" : ""} ${isMine ? "mine" : ""} ${boom === i ? "boom" : ""}`}
              style={v ? { color: NUM[v] } : undefined} onClick={() => click(i)} onContextMenu={(e) => flag(e, i)}>
              {isMine ? "✹" : i in open ? (v || "") : flags[i] ? "⚑" : ""}
            </button>
          );
        })}
      </div>
      {result && <ResultCard result={result} hint={result.error === "time" ? "time ran out" : "you hit a mine"} onAgain={() => { setInfo(null); setResult(null); }} />}
      <div className="msg">{msg}</div>
    </>
  );
}

export default function Page() {
  return (
    <Shell title="MINEFIELD" rules={<>
      <li>Click a square to open it. Numbers show how many mines touch that square.</li>
      <li><b>Right-click</b> (or switch ⚑ on) to flag a mine. Your first click is always safe.</li>
      <li>Maps change every game: square, diamond, donut or cross.</li>
      <li>Open every safe square to win: <b>100 / 220 / 400</b> by difficulty, plus up to <b>+50%</b> for speed.</li>
      <li>Hit a mine or run out of time and the game scores 0.</li>
    </>}>{() => <Game />}</Shell>
  );
}
