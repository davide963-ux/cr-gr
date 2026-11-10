// Home-page scene: a pixel-art arcade hall. One cabinet per live game; each cabinet is a link.
// Pure SVG + CSS animation (see .arcade in globals.css).
import { CATALOG } from "@/lib/games";
import { GameArt } from "./GameLogo";

const COLOR: Record<string, string> = { blocks: "#8a5cff", bricks: "#ff5470", mines: "#3ddc84", sort: "#ffd24a" };
const F = "'Jersey 20', monospace";

function Cabinet({ x, id, name, href, i }: { x: number; id: string; name: string; href: string; i: number }) {
  const c = COLOR[id] ?? "#17e8e8";
  return (
    <a href={href} className="cab" aria-label={`Play ${name}`}>
      {/* glow on the floor */}
      <ellipse cx={x + 32} cy="137" rx="38" ry="5" fill={c} opacity=".18" className="pulse" style={{ animationDelay: `${i * 0.4}s` }} />
      {/* body */}
      <rect x={x} y="40" width="64" height="94" fill="#23265c" />
      <rect x={x} y="40" width="4" height="94" fill="#2f3378" /><rect x={x + 60} y="40" width="4" height="94" fill="#181a44" />
      {/* marquee */}
      <rect x={x - 2} y="28" width="68" height="15" fill={c} />
      <rect x={x - 2} y="28" width="68" height="3" fill="#fff" opacity=".35" /><rect x={x - 2} y="40" width="68" height="3" fill="#000" opacity=".25" />
      <text x={x + 32} y="39.5" textAnchor="middle" fontFamily={F} fontSize="9.5" fill="#0c0c2c">{name}</text>
      {/* screen */}
      <rect x={x + 3} y="46" width="58" height="33" fill="#05051a" />
      <svg x={x + 4} y="47" width="56" height="31" viewBox="0 0 160 80" preserveAspectRatio="xMidYMid slice"><rect width="160" height="80" fill="#12143a" /><GameArt id={id} /></svg>
      <rect x={x + 4} y="47" width="56" height="31" fill="#fff" opacity=".05" className="flick" style={{ animationDelay: `${i * 0.7}s` }} />
      <rect x={x + 4} y="47" width="56" height="2" fill="#fff" opacity=".12" className="scan" style={{ animationDelay: `${i * 0.9}s` }} />
      {/* control panel */}
      <rect x={x - 3} y="82" width="70" height="11" fill="#3a3f8f" /><rect x={x - 3} y="82" width="70" height="2" fill="#fff" opacity=".25" /><rect x={x - 3} y="91" width="70" height="2" fill="#000" opacity=".3" />
      <g className="stick" style={{ transformOrigin: `${x + 14}px 88px`, animationDelay: `${i * 0.3}s` }}>
        <rect x={x + 13} y="83" width="2" height="4" fill="#cfd6ea" /><rect x={x + 11} y="79.5" width="6" height="4" fill="#ff5470" /><rect x={x + 12} y="79.5" width="2" height="1.5" fill="#fff" opacity=".6" />
      </g>
      <rect x={x + 10} y="86" width="8" height="2" fill="#12143a" />
      <rect x={x + 34} y="85" width="5" height="4" fill="#ffd24a" className="blinkb" style={{ animationDelay: `${i * 0.2}s` }} />
      <rect x={x + 42} y="85" width="5" height="4" fill="#17e8e8" className="blinkb" style={{ animationDelay: `${i * 0.2 + 0.3}s` }} />
      <rect x={x + 50} y="85" width="5" height="4" fill="#3ddc84" className="blinkb" style={{ animationDelay: `${i * 0.2 + 0.6}s` }} />
      {/* front: PLAY sign + coin slot */}
      <rect x={x + 12} y="99" width="40" height="13" fill="#0c0c2c" /><rect x={x + 12} y="99" width="40" height="13" fill="none" stroke={c} strokeWidth="1" />
      <text x={x + 32} y="109" textAnchor="middle" fontFamily={F} fontSize="9" fill={c} className="playtxt" style={{ animationDelay: `${i * 0.25}s` }}>▶ PLAY</text>
      <rect x={x + 27} y="117" width="10" height="9" fill="#12143a" /><rect x={x + 31} y="119" width="2" height="5" fill="#ffd24a" />
      {/* base */}
      <rect x={x - 3} y="132" width="70" height="5" fill="#12143a" />
      {/* click target */}
      <rect x={x - 3} y="28" width="70" height="109" fill="transparent" />
    </a>
  );
}

export default function Arcade() {
  const games = CATALOG.filter((g) => g.live).slice(0, 4);
  const gap = games.length ? (320 - games.length * 64) / (games.length + 1) : 0;
  const bulbs = Array.from({ length: 27 }, (_, i) => 8 + i * 11.7);
  return (
    <svg className="arcade" viewBox="0 0 320 150" shapeRendering="crispEdges" role="img" aria-label="HashRush arcade: pick a game cabinet to play">
      {/* wall */}
      <rect width="320" height="126" fill="#1a1444" />
      {Array.from({ length: 10 }, (_, i) => <rect key={i} x={i * 32} y="0" width="16" height="126" fill="#1e1850" />)}
      <rect y="118" width="320" height="8" fill="#120e33" />
      {/* string of bulbs */}
      <rect y="5" width="320" height="1" fill="#0c0c2c" />
      {bulbs.map((x, i) => <rect key={i} x={x} y="5" width="3" height="3" fill={["#ffd24a", "#17e8e8", "#ff5470", "#3ddc84"][i % 4]} className="bulb" style={{ animationDelay: `${(i % 3) * 0.35}s` }} />)}
      {/* neon sign */}
      <text x="160" y="23" textAnchor="middle" fontFamily={F} fontSize="15" fill="#17e8e8" className="neonsign" letterSpacing="3">HASHRUSH ARCADE</text>
      <rect x="92" y="25.5" width="136" height="1" fill="#ff9a1f" className="neonsign" />
      {/* floor: checker tiles */}
      <rect y="126" width="320" height="24" fill="#2a1f5c" />
      {Array.from({ length: 3 }, (_, r) => Array.from({ length: 20 }, (_, c) => ((r + c) % 2 === 0
        ? <rect key={`${r}-${c}`} x={c * 16} y={126 + r * 8} width="16" height="8" fill="#3a2c7a" /> : null)))}
      {games.map((g, i) => <Cabinet key={g.id} i={i} x={Math.round(gap + i * (64 + gap))} id={g.id} name={g.name} href={g.href} />)}
      {!games.length && <text x="160" y="85" textAnchor="middle" fontFamily={F} fontSize="14" fill="#8e91c2">NEW GAMES COMING SOON</text>}
      {/* floating sparkles */}
      {[[22, 17, 0], [298, 18, 1.1], [62, 21, 0.5], [258, 15, 1.7]].map(([x, y, d], i) =>
        <g key={i} className="spark" style={{ animationDelay: `${d}s` }} fill="#fff"><rect x={x} y={y - 2} width="1" height="5" /><rect x={x - 2} y={y} width="5" height="1" /></g>)}
    </svg>
  );
}
