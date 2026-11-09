"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";
import LoginBox from "./LoginBox";
import { useMe } from "./useMe";

export type Result = { ok: boolean; won?: boolean; score?: number; points?: number; error?: string };
export const refreshMe = () => window.dispatchEvent(new Event("hr:refresh"));

export async function post(path: string, body: unknown): Promise<{ ok: boolean; d: any }> {
  try {
    const r = await fetch(path, { method: "POST", body: JSON.stringify(body) });
    return { ok: r.ok, d: await r.json().catch(() => ({})) };
  } catch { return { ok: false, d: { error: "Network error, try again" } }; }
}
export const toResult = (r: { ok: boolean; d: any }): Result => (r.ok ? { ok: true, ...r.d } : { ok: false, error: r.d?.error ?? "Rejected" });

/** Page frame shared by all games: login gate on the left, rules on the right. */
export function Shell({ title, rules, children }: { title: string; rules: React.ReactNode; children: (handle: string) => React.ReactNode }) {
  const me = useMe();
  return (
    <div className="stage">
      <div className="panel">
        <h2 className="px">{title}</h2>
        {me === undefined ? <div className="empty">Loading…</div> : me.x_username ? children(me.x_username) : <LoginBox />}
      </div>
      <div className="grid">
        <div className="panel"><h2 className="px">HOW IT WORKS</h2><ul className="rules">{rules}</ul></div>
        <Link href="/play" className="btn ghost">← All games</Link>
      </div>
    </div>
  );
}

export function ResultCard({ result, hint, onAgain, busy }: { result: Result; hint: string; onAgain: () => void; busy?: boolean }) {
  return (
    <div className="result">
      {result.ok ? (
        <>
          <div className={`big px ${result.won ? "win" : "lose"}`}>{result.won ? "YOU WON!" : "GAME OVER"}</div>
          <p>Score <b style={{ color: "var(--gold)" }}>{result.score}</b>
            {result.won ? <> · <b style={{ color: "var(--green)" }}>+{result.points} points</b> added to the leaderboard</> : <> · {hint}</>}</p>
        </>
      ) : <div className="big px lose" style={{ fontSize: 18 }}>{result.error}</div>}
      <button className="btn" onClick={onAgain} disabled={busy}>↻ Play again</button>
    </div>
  );
}

/** Fixed-timestep loop (60 ticks/s) that survives tab switches without fast-forwarding. */
export function useTicker(active: boolean, tick: () => void, draw: () => void) {
  const fn = useRef({ tick, draw });
  fn.current = { tick, draw };
  useEffect(() => {
    if (!active) return;
    let raf = 0, last = performance.now(), acc = 0;
    const STEP = 1000 / 60;
    const frame = (now: number) => {
      acc += Math.min(250, now - last); last = now;
      while (acc >= STEP) { fn.current.tick(); acc -= STEP; }
      fn.current.draw();
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [active]);
}

/** Size a canvas for the device pixel ratio and return a context scaled to logical units. */
export function ctx2d(cv: HTMLCanvasElement | null, w: number, h: number): CanvasRenderingContext2D | null {
  if (!cv) return null;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  if (cv.width !== w * dpr) { cv.width = w * dpr; cv.height = h * dpr; }
  const c = cv.getContext("2d");
  c?.setTransform(dpr, 0, 0, dpr, 0, 0);
  return c;
}
