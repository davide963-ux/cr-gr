// Brick Chaos. Fixed-timestep deterministic simulation (only + - * / sqrt, no trig), so the server
// can replay the paddle log and compute the score itself. 3 levels: classic wall, moving bricks, boss.
import { rng } from "./rng";
import { bad, verdict, type Verdict } from "./types";

export const W = 400, H = 520, TPS = 60, MAX_TICKS = 360 * TPS; // 6-minute cap
export const PY = 490, PH = 10, R = 5;
const BW = 36, BH = 14, GAP = 4, LEFT = 2, TOP = 50;
export const POWER = { WIDE: 0, MULTI: 1, SLOW: 2, LIFE: 3 } as const;

export type Brick = { x: number; bx: number; y: number; w: number; h: number; hp: number; max: number; mv: number; boss: boolean; row: number };
export type Ball = { x: number; y: number; vx: number; vy: number };
export type Drop = { x: number; y: number; t: number };

export class BrickGame {
  tick = 0; level = 0; cleared = 0; lives = 3; score = 0; over = false; bossDead = false;
  px = W / 2; wideUntil = 0; slowUntil = 0; launchAt = 45;
  balls: Ball[] = []; bricks: Brick[] = []; drops: Drop[] = []; shots: { x: number; y: number }[] = [];
  private rand: () => number;

  constructor(seed: string) { this.rand = rng(seed + ":bricks"); this.load(0); }
  get pw() { return this.tick < this.wideUntil ? 100 : 64; }
  get speed() { return 5.2 + this.level * 0.4; }
  get boss() { return this.bricks.find((b) => b.boss && b.hp > 0); }

  private row(row: number, y: number, hp: number, moving: number) {
    const n = moving ? 8 : 10;
    for (let i = 0; i < n; i++) {
      const bx = LEFT + i * (BW + GAP);
      this.bricks.push({ x: bx, bx, y, w: BW, h: BH, hp, max: hp, mv: moving, boss: false, row });
    }
  }
  private load(level: number) {
    this.bricks = []; this.balls = []; this.drops = []; this.shots = [];
    const y = (r: number) => TOP + r * (BH + GAP);
    if (level === 0) for (let r = 0; r < 4; r++) this.row(r, y(r), 1, 0);
    else if (level === 1) {
      this.row(0, y(0), 2, 0); this.row(1, y(1), 1, 1); this.row(2, y(2), 1, 0); this.row(3, y(3), 1, 161);
    } else {
      this.bricks.push({ x: 20, bx: 20, y: 36, w: 120, h: 40, hp: 25, max: 25, mv: 1, boss: true, row: 0 });
      this.row(1, 110, 2, 81); this.row(2, 132, 1, 0);
    }
  }
  private fix(b: Ball) { // never let a ball travel (almost) horizontally forever
    const sp = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
    if (Math.abs(b.vy) < sp * 0.25) {
      b.vy = (b.vy < 0 ? -1 : 1) * sp * 0.25;
      b.vx = (b.vx < 0 ? -1 : 1) * Math.sqrt(sp * sp - b.vy * b.vy);
    }
  }
  private hit(br: Brick) {
    br.hp--; this.score += br.boss ? 4 : 2;
    if (br.hp > 0) return;
    if (br.boss) { this.score += 100; this.bossDead = true; this.over = true; return; }
    if (this.rand() < 0.18) {
      const t = this.rand();
      this.drops.push({ x: br.x + br.w / 2, y: br.y + br.h / 2, t: t < 0.4 ? 0 : t < 0.75 ? 1 : t < 0.95 ? 2 : 3 });
    }
  }
  private power(t: number) {
    if (t === POWER.WIDE) this.wideUntil = this.tick + 600;
    else if (t === POWER.SLOW) this.slowUntil = this.tick + 480;
    else if (t === POWER.LIFE) this.lives = Math.min(5, this.lives + 1);
    else {
      const n = this.balls.length, c = 0.9, s = 0.4358898943540674;
      for (let i = 0; i < n && this.balls.length < 6; i++) {
        const b = this.balls[i];
        for (const sg of [1, -1]) {
          if (this.balls.length >= 6) break;
          const nb = { x: b.x, y: b.y, vx: b.vx * c - b.vy * s * sg, vy: b.vx * s * sg + b.vy * c };
          this.fix(nb); this.balls.push(nb);
        }
      }
    }
  }

  /** Advance one tick with the paddle centred at `input` (clamped to the field). */
  step(input: number) {
    if (this.over) return;
    const pw = this.pw, px = (this.px = Math.min(W - pw / 2, Math.max(pw / 2, input)));
    for (const b of this.bricks) {
      if (!b.mv) continue;
      if (b.boss) { const p = this.tick % 960; b.x = b.bx + (p < 480 ? p : 960 - p) * 0.5; }
      else { const p = (this.tick + b.mv - 1) % 320; b.x = b.bx + (p < 160 ? p : 320 - p) * 0.5; }
    }
    const boss = this.boss;
    if (boss && this.tick % 150 === 149) this.shots.push({ x: boss.x + boss.w / 2, y: boss.y + boss.h });

    if (!this.balls.length) {
      if (this.tick >= this.launchAt) {
        const sp = this.speed, vx = sp * 0.35 * (this.rand() < 0.5 ? -1 : 1);
        this.balls.push({ x: px, y: PY - R, vx, vy: -Math.sqrt(sp * sp - vx * vx) });
      }
    } else {
      const f = (this.tick < this.slowUntil ? 0.65 : 1) * 0.5;
      for (let bi = this.balls.length - 1; bi >= 0 && !this.over; bi--) {
        const b = this.balls[bi];
        let dead = false;
        for (let s = 0; s < 2 && !dead && !this.over; s++) {
          b.x += b.vx * f; b.y += b.vy * f;
          if (b.x < R) { b.x = R; b.vx = Math.abs(b.vx); } else if (b.x > W - R) { b.x = W - R; b.vx = -Math.abs(b.vx); }
          if (b.y < R) { b.y = R; b.vy = Math.abs(b.vy); }
          if (b.vy > 0 && b.y + R >= PY && b.y + R <= PY + PH + 6 && Math.abs(b.x - px) <= pw / 2 + R) {
            const sp = this.speed, k = Math.max(-1, Math.min(1, (b.x - px) / (pw / 2))) * 0.8;
            b.vx = sp * k; b.vy = -Math.sqrt(sp * sp - b.vx * b.vx); b.y = PY - R;
          }
          for (const br of this.bricks) {
            if (br.hp <= 0) continue;
            const oL = b.x + R - br.x, oR = br.x + br.w - (b.x - R), oT = b.y + R - br.y, oB = br.y + br.h - (b.y - R);
            if (oL <= 0 || oR <= 0 || oT <= 0 || oB <= 0) continue;
            if (Math.min(oL, oR) < Math.min(oT, oB)) b.vx = oL < oR ? -Math.abs(b.vx) : Math.abs(b.vx);
            else b.vy = oT < oB ? -Math.abs(b.vy) : Math.abs(b.vy);
            this.hit(br);
            break;
          }
          if (b.y > H + R) dead = true;
        }
        if (dead) this.balls.splice(bi, 1);
      }
      if (!this.over && !this.balls.length) {
        if (--this.lives <= 0) this.over = true; else this.launchAt = this.tick + 45;
      }
    }
    this.bricks = this.bricks.filter((b) => b.hp > 0);

    for (let i = this.drops.length - 1; i >= 0 && !this.over; i--) {
      const d = this.drops[i]; d.y += 2;
      if (d.y + 8 >= PY && d.y - 8 <= PY + PH && Math.abs(d.x - px) <= pw / 2 + 8) { this.drops.splice(i, 1); this.power(d.t); }
      else if (d.y > H + 10) this.drops.splice(i, 1);
    }
    for (let i = this.shots.length - 1; i >= 0 && !this.over; i--) {
      const s = this.shots[i]; s.y += 2.5;
      if (s.y >= PY && s.y <= PY + PH + 4 && Math.abs(s.x - px) <= pw / 2 + 3) {
        this.shots.splice(i, 1);
        if (--this.lives <= 0) this.over = true;
      } else if (s.y > H + 10) this.shots.splice(i, 1);
    }
    if (!this.over && this.level < 2 && !this.bricks.length) {
      this.score += 50; this.cleared++; this.level++; this.load(this.level); this.launchAt = this.tick + 60;
    }
    if (++this.tick >= MAX_TICKS) this.over = true;
  }
}

/** Server: replay the paddle log ([tick, x, tick, x, …], strictly increasing ticks) and score it. */
export function scoreBrick(seed: string, body: any, elapsedMs: number): Verdict {
  const log = body?.log, ticks = body?.ticks;
  if (!Array.isArray(log) || log.length % 2 || log.length > 2 * MAX_TICKS) return bad("bad log");
  if (!Number.isInteger(ticks) || ticks < 0 || ticks > MAX_TICKS) return bad("bad ticks");
  let prev = -1;
  for (let i = 0; i < log.length; i += 2) {
    const t = log[i], x = log[i + 1];
    if (!Number.isInteger(t) || t <= prev || t >= MAX_TICKS || !Number.isInteger(x) || x < 0 || x > W) return bad("malformed log");
    prev = t;
  }
  const g = new BrickGame(seed);
  let i = 0, px = W / 2;
  while (!g.over && g.tick < ticks) {
    if (i < log.length && log[i] === g.tick) { px = log[i + 1]; i += 2; }
    g.step(px);
  }
  if (elapsedMs < (g.tick / TPS) * 1000 * 0.9) return bad("finished too fast");
  return verdict(g.score, g.cleared >= 1);
}
