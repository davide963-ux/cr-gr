"use client";
import { useEffect, useRef, useState } from "react";
import { Shell, StartCard, Overlay, post, toResult, refreshMe, useTicker, ctx2d, type Result } from "@/components/GameShell";
import { BrickGame, W, H, PY, PH, R, KINDS } from "@/lib/games/brick";

const ROWC = ["#ff5470", "#ff9a1f", "#ffd24a", "#3ddc84", "#17e8e8", "#8a5cff"];
const DROP = [["W", "#17e8e8"], ["M", "#ffd24a"], ["S", "#8a5cff"], ["+", "#3ddc84"], ["B", "#ff5470"]];

function Game() {
  const [phase, setPhase] = useState<"idle" | "play" | "over">("idle");
  const [hud, setHud] = useState({ score: 0, lives: 3, level: 0, ammo: 10 });
  const [result, setResult] = useState<Result | null>(null);
  const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false);
  const cv = useRef<HTMLCanvasElement>(null);
  const run = useRef<{ id: string; g: BrickGame; log: number[]; fires: number[]; fire: boolean; target: number; last: number; keys: Record<string, boolean> } | null>(null);
  const lastG = useRef<BrickGame | null>(null); // keeps the final board on screen after the game ends

  async function start() {
    setBusy(true); setMsg(""); setResult(null);
    const r = await post("/api/game/start", { game: "bricks" });
    setBusy(false);
    if (!r.ok) return setMsg(r.d.error ?? "Could not start");
    run.current = { id: r.d.id, g: new BrickGame(r.d.seed), log: [], fires: [], fire: false, target: W / 2, last: W / 2, keys: {} };
    lastG.current = run.current.g;
    setPhase("play");
  }
  async function finish() {
    const r = run.current; if (!r) return;
    run.current = null; setPhase("over");
    setResult(toResult(await post("/api/game/finish", { id: r.id, log: r.log, fires: r.fires, ticks: r.g.tick })));
    refreshMe();
  }
  const aim = (e: React.PointerEvent) => {
    const r = run.current, el = cv.current; if (!r || !el) return;
    const b = el.getBoundingClientRect(); r.target = ((e.clientX - b.left) / b.width) * W;
  };
  const shoot = () => { if (run.current) run.current.fire = true; };
  useEffect(() => {
    if (phase !== "play") return;
    const k = (v: boolean) => (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); if (run.current) run.current.keys[e.key] = v; }
      else if (e.key === " " && v) { e.preventDefault(); if (!e.repeat) shoot(); }
    };
    const kd = k(true), ku = k(false);
    window.addEventListener("keydown", kd); window.addEventListener("keyup", ku);
    return () => { window.removeEventListener("keydown", kd); window.removeEventListener("keyup", ku); };
  }, [phase]);

  useTicker(phase !== "idle", () => {
    const r = run.current; if (!r || r.g.over) return;
    if (r.keys.ArrowLeft) r.target -= 7; if (r.keys.ArrowRight) r.target += 7;
    r.target = Math.max(0, Math.min(W, r.target));
    const x = Math.round(r.target);
    if (x !== r.last) { r.log.push(r.g.tick, x); r.last = x; } // only changes are logged
    const fire = r.fire && r.g.ammo > 0 && r.g.tick >= r.g.fireAt; r.fire = false;
    if (fire) r.fires.push(r.g.tick);
    r.g.step(x, fire);
    if (r.g.over) finish();
  }, () => {
    const g = lastG.current, c = ctx2d(cv.current, W, H); if (!g || !c) return;
    c.fillStyle = "#0c0c2c"; c.fillRect(0, 0, W, H);
    for (const b of g.bricks) {
      if (b.boss) {
        c.fillStyle = "#b3123a"; c.fillRect(b.x, b.y, b.w, b.h);
        c.fillStyle = "#ff5470"; c.fillRect(b.x + 4, b.y + 4, b.w - 8, b.h - 8);
        c.fillStyle = "#0c0c2c"; c.fillRect(b.x + 26, b.y + 12, 14, 10); c.fillRect(b.x + b.w - 40, b.y + 12, 14, 10); c.fillRect(b.x + 40, b.y + 28, b.w - 80, 5);
        c.fillStyle = "#2a2d63"; c.fillRect(b.x, b.y - 9, b.w, 5);
        c.fillStyle = "#3ddc84"; c.fillRect(b.x, b.y - 9, (b.w * b.hp) / b.max, 5);
      } else {
        c.fillStyle = ROWC[b.row % ROWC.length]; c.globalAlpha = b.hp < b.max ? 0.55 : 1; c.fillRect(b.x, b.y, b.w, b.h); c.globalAlpha = 1;
        c.fillStyle = "rgba(255,255,255,.3)"; c.fillRect(b.x, b.y, b.w, 3);
        if (b.max > 1 && b.hp === b.max) { c.strokeStyle = "#fff"; c.strokeRect(b.x + 1.5, b.y + 1.5, b.w - 3, b.h - 3); }
      }
    }
    c.font = "bold 11px sans-serif"; c.textAlign = "center"; c.textBaseline = "middle";
    for (const d of g.drops) { c.fillStyle = DROP[d.t][1]; c.beginPath(); c.arc(d.x, d.y, 8, 0, 7); c.fill(); c.fillStyle = "#0c0c2c"; c.fillText(DROP[d.t][0], d.x, d.y + 0.5); }
    c.fillStyle = "#ff5470"; for (const s of g.shots) c.fillRect(s.x - 3, s.y - 7, 6, 14);
    c.fillStyle = "#ffd24a"; for (const u of g.bullets) c.fillRect(u.x - 1.5, u.y, 3, 10);
    if (g.ammo > 0) { c.fillStyle = "#ffd24a"; for (const dx of [-g.pw / 2 + 4, 0, g.pw / 2 - 4]) c.fillRect(g.px + dx - 2, PY - 4, 4, 4); }
    c.fillStyle = g.tick < g.wideUntil ? "#17e8e8" : "#ff9a1f"; c.fillRect(g.px - g.pw / 2, PY, g.pw, PH);
    c.fillStyle = "#fff";
    if (g.balls.length) for (const b of g.balls) { c.beginPath(); c.arc(b.x, b.y, R, 0, 7); c.fill(); }
    else { c.beginPath(); c.arc(g.px, PY - R, R, 0, 7); c.fill(); }
    setHud((h) => (h.score === g.score && h.lives === g.lives && h.level === g.level && h.ammo === g.ammo ? h : { score: g.score, lives: g.lives, level: g.level, ammo: g.ammo }));
  });

  return (
    <>
      {phase === "idle" && <StartCard id="bricks" name="Brick Chaos" text="Break the bricks, shoot your bullets, beat the bosses. No timer, endless levels." onStart={start} busy={busy} />}
      {phase !== "idle" && (
        <>
          <div className="hud">
            <div className="stat"><span>Score</span><b>{hud.score}</b></div>
            <div className="stat"><span>Lives</span><b>{"♥".repeat(Math.max(0, hud.lives))}</b></div>
            <div className="stat"><span>Level {hud.level + 1}</span><b>{KINDS[hud.level % 5]}</b></div>
            <div className="stat"><span>Bullets</span><b>{hud.ammo} × 3</b></div>
          </div>
          <div className="boardwrap" style={{ width: `min(100%, 660px, calc((100vh - 410px) * ${W / H}))`, minWidth: 240 }}>
            <canvas ref={cv} className="board wide" style={{ width: "100%", aspectRatio: `${W} / ${H}` }} onPointerMove={aim} onPointerDown={(e) => { aim(e); if (e.pointerType === "mouse") shoot(); }} />
            {phase === "over" && <Overlay result={result} hint="you need 60 to win points" onAgain={start} busy={busy} />}
          </div>
          {phase === "play" && <button className="btn fire" onPointerDown={(e) => { e.preventDefault(); shoot(); }} disabled={hud.ammo === 0}>🔫 Fire ({hud.ammo})</button>}
        </>
      )}
      <div className="msg">{msg}</div>
    </>
  );
}

export default function Page() {
  return (
    <Shell id="bricks" title="BRICK CHAOS" rules={<>
      <li>Move the paddle with your <b>mouse / finger</b> or <b>← →</b>.</li>
      <li><b>Bullets:</b> click, press <b>Space</b> or tap <b>Fire</b> to shoot 3 bullets at once. You get <b>10 volleys</b>; a red <b style={{ color: "var(--red)" }}>B</b> drop refills them.</li>
      <li>No timer and endless levels: wall, movers, checker, pyramid, then a <b>boss</b> that shoots back. Each round is faster and tougher.</li>
      <li>Power-ups: <b style={{ color: "var(--cyan)" }}>W</b> wide paddle, <b style={{ color: "var(--gold)" }}>M</b> multi-ball, <b style={{ color: "var(--purple)" }}>S</b> slow, <b style={{ color: "var(--green)" }}>+</b> extra life.</li>
      <li><b>2</b> per brick hit, <b>+50</b> per level, boss <b>4</b> per hit and <b>+100</b> for the kill.</li>
      <li>Score <b>60+</b> = a won game; your score becomes points. You have 3 lives.</li>
    </>}>{() => <Game />}</Shell>
  );
}
