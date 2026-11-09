"use client";
import { useRef, useState } from "react";
import { Shell, ResultCard, post, toResult, refreshMe, type Result } from "@/components/GameShell";
import { SortGame, SORT_LEVELS, CAP, canMove } from "@/lib/games/sort";

const BALL = ["#ff5470", "#4a7dff", "#ffd24a", "#3ddc84", "#8a5cff", "#ff9a1f", "#17e8e8"];

function Game() {
  const [phase, setPhase] = useState<"idle" | "play" | "over">("idle");
  const [, bump] = useState(0);
  const [sel, setSel] = useState<number | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false);
  const run = useRef<{ id: string; g: SortGame; moves: number[] } | null>(null);

  async function start() {
    setBusy(true); setMsg(""); setResult(null); setSel(null);
    const r = await post("/api/game/start", { game: "sort" });
    setBusy(false);
    if (!r.ok) return setMsg(r.d.error ?? "Could not start");
    run.current = { id: r.d.id, g: new SortGame(r.d.seed), moves: [] };
    setPhase("play");
  }
  async function finish() {
    const r = run.current; if (!r || phase !== "play") return;
    setPhase("over");
    setResult(toResult(await post("/api/game/finish", { id: r.id, moves: r.moves })));
    refreshMe();
  }
  function tap(i: number) {
    const r = run.current; if (!r || phase !== "play") return;
    if (sel === null) { if (r.g.tubes[i].length) setSel(i); return; }
    if (sel === i) return setSel(null);
    if (!canMove(r.g.tubes, sel, i)) { setSel(r.g.tubes[i].length ? i : null); return; }
    r.g.move(sel, i); r.moves.push(sel, i); setSel(null); bump((n) => n + 1);
    if (r.g.over) finish();
  }

  const g = run.current?.g;
  return (
    <>
      {phase === "idle" && <div className="result"><p>Sort the balls so every tube holds one colour.</p><button className="btn" onClick={start} disabled={busy}>▶ Start</button></div>}
      {g && phase !== "idle" && (
        <>
          <div className="hud">
            <div className="stat"><span>Level</span><b>{Math.min(g.level + 1, SORT_LEVELS.length)} / {SORT_LEVELS.length}</b></div>
            <div className="stat"><span>Moves left</span><b data-testid="left">{g.limit - g.used}</b></div>
            <div className="stat"><span>Score</span><b>{g.score}</b></div>
            {phase === "play" && <button className="btn sm ghost" onClick={finish}>Finish</button>}
          </div>
          <div className="tubes">
            {g.tubes.map((t, i) => (
              <button key={i} data-tube={i} className={`tube ${sel === i ? "sel" : ""}`} onClick={() => tap(i)} style={{ height: CAP * 38 + 14 }}>
                {t.map((c, k) => <i key={k} className={sel === i && k === t.length - 1 ? "lift" : ""} style={{ background: BALL[c] }} />)}
              </button>
            ))}
          </div>
        </>
      )}
      {phase === "over" && (result ? <ResultCard result={result} hint="clear 2 levels to win points" onAgain={start} busy={busy} /> : <div className="empty">Checking your score…</div>)}
      <div className="msg">{msg}</div>
    </>
  );
}

export default function Page() {
  return (
    <Shell title="COLOR SORT" rules={<>
      <li>Tap a tube to pick its top ball, then tap where it goes.</li>
      <li>A ball can only land on the <b>same colour</b> or in an <b>empty tube</b>.</li>
      <li>5 levels: each adds a colour and gives you fewer spare moves.</li>
      <li>Level points <b>40 / 60 / 80 / 100 / 120</b>, plus <b>+1</b> per unused move.</li>
      <li>Run out of moves and the game ends. Clear <b>2+</b> levels = a won game.</li>
    </>}>{() => <Game />}</Shell>
  );
}
