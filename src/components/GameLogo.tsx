// Pixel-art logos for the game cards. Pure SVG (160×80 units), crisp at any size.
const C = { cyan: "#17e8e8", gold: "#ffd24a", purple: "#8a5cff", green: "#3ddc84", red: "#ff5470", blue: "#4a7dff", orange: "#ff9a1f", dark: "#0c0c2c" };

/** One shaded block: base colour, light top edge, dark bottom edge. */
function B({ x, y, s = 10, c }: { x: number; y: number; s?: number; c: string }) {
  return (
    <g>
      <rect x={x} y={y} width={s} height={s} fill={c} />
      <rect x={x} y={y} width={s} height={s * 0.2} fill="#fff" opacity=".35" />
      <rect x={x} y={y + s * 0.8} width={s} height={s * 0.2} fill="#000" opacity=".25" />
      <rect x={x} y={y} width={s} height={s} fill="none" stroke={C.dark} strokeWidth="1" />
    </g>
  );
}
const cells = (list: [number, number][], ox: number, oy: number, c: string, s = 10) =>
  list.map(([x, y], i) => <B key={`${c}${ox}${oy}${i}`} x={ox + x * s} y={oy + y * s} c={c} s={s} />);

function Blocks() {
  return (
    <>
      <rect x="40" y="2" width="80" height="76" fill={C.dark} opacity=".55" />
      {[50, 60, 70, 80, 90, 100, 110].map((x) => <rect key={x} x={x} y="2" width="1" height="76" fill="#fff" opacity=".06" />)}
      {/* settled stack */}
      {cells([[0, 0], [1, 0], [2, 0], [3, 0]], 40, 68, C.cyan)}
      {cells([[0, 0], [1, 0], [0, -1], [1, -1]], 80, 68, C.gold)}
      {cells([[0, 0], [1, 0]], 100, 68, C.red)}
      {cells([[0, 0], [0, -1], [1, -1]], 40, 58, C.orange)}
      {cells([[0, 0], [1, 0], [1, -1]], 60, 58, C.green)}
      {cells([[0, 0], [1, 0], [1, -1]], 100, 58, C.blue)}
      {cells([[0, 0]], 110, 38, C.blue)}
      {/* falling T piece + its landing ghost */}
      {cells([[0, 0], [1, 0], [2, 0], [1, 1]], 60, 12, C.purple)}
      <g fill="none" stroke="#fff" strokeWidth="1" opacity=".5" strokeDasharray="2 2">
        <rect x="70.5" y="38.5" width="9" height="9" /><rect x="60.5" y="28.5" width="9" height="9" /><rect x="70.5" y="28.5" width="9" height="9" /><rect x="80.5" y="28.5" width="9" height="9" />
      </g>
      <g fill="#fff" opacity=".7"><rect x="64" y="4" width="1" height="6" /><rect x="74" y="2" width="1" height="8" /><rect x="84" y="4" width="1" height="6" /></g>
    </>
  );
}

function Bricks() {
  const rows = [C.red, C.orange, C.gold, C.green];
  return (
    <>
      <rect x="22" y="2" width="116" height="76" fill={C.dark} opacity=".55" />
      {rows.map((c, r) => [0, 1, 2, 3, 4, 5].map((i) => {
        if ((r === 2 && i === 3) || (r === 3 && (i === 2 || i === 3))) return null; // smashed
        const x = 26 + i * 18, y = 8 + r * 8;
        return <g key={`${r}${i}`}><rect x={x} y={y} width="16" height="6" fill={c} /><rect x={x} y={y} width="16" height="2" fill="#fff" opacity=".35" /></g>;
      }))}
      {/* debris + ball trail */}
      <rect x="76" y="36" width="3" height="3" fill={C.green} /><rect x="86" y="40" width="2" height="2" fill={C.gold} /><rect x="70" y="42" width="2" height="2" fill={C.green} />
      <g fill="#fff"><rect x="88" y="60" width="3" height="3" opacity=".2" /><rect x="85" y="55" width="4" height="4" opacity=".4" /><rect x="82" y="49" width="5" height="5" opacity=".65" /></g>
      <rect x="78" y="42" width="6" height="6" fill="#fff" /><rect x="79" y="41" width="4" height="8" fill="#fff" /><rect x="77" y="43" width="8" height="4" fill="#fff" />
      {/* falling power-up */}
      <rect x="40" y="46" width="10" height="10" fill={C.cyan} /><rect x="41" y="45" width="8" height="12" fill={C.cyan} />
      <path d="M42 48h1v5h1v-2h2v2h1v-5h1v6h-2v-1h-2v1h-2z" fill={C.dark} />
      {/* paddle */}
      <rect x="66" y="68" width="34" height="6" fill={C.orange} /><rect x="66" y="68" width="34" height="2" fill="#fff" opacity=".4" /><rect x="64" y="69" width="2" height="4" fill={C.orange} /><rect x="100" y="69" width="2" height="4" fill={C.orange} />
    </>
  );
}

function Mines() {
  const open = new Set(["1,1", "2,1", "3,1", "1,2", "2,2", "3,2", "2,3", "3,3", "4,2"]);
  const nums: Record<string, [string, string]> = { "1,1": ["1", C.cyan], "3,1": ["2", C.green], "1,2": ["1", C.cyan], "3,3": ["3", C.red], "4,2": ["1", C.cyan] };
  const out = [];
  for (let r = 0; r < 5; r++) for (let c = 0; c < 7; c++) {
    const x = 28 + c * 15, y = 3 + r * 15, k = `${c},${r}`;
    out.push(open.has(k)
      ? <g key={k}><rect x={x} y={y} width="14" height="14" fill="#14153a" />{nums[k] && <text x={x + 7} y={y + 11} textAnchor="middle" fontSize="11" fontWeight="700" fontFamily="'Pixelify Sans', monospace" fill={nums[k][1]}>{nums[k][0]}</text>}</g>
      : <g key={k}><rect x={x} y={y} width="14" height="14" fill="#3f45a0" /><rect x={x} y={y} width="14" height="2" fill="#fff" opacity=".3" /><rect x={x} y={y + 11} width="14" height="3" fill="#000" opacity=".28" /></g>);
  }
  return (
    <>
      {out}
      {/* flag */}
      <rect x="110" y="20" width="2" height="11" fill="#fff" /><path d="M112 20h7v2h-2v2h-2v2h-3z" fill={C.red} /><rect x="107" y="30" width="8" height="2" fill="#fff" />
      {/* the mine */}
      <rect x="58" y="33" width="14" height="14" fill={C.red} />
      <g fill={C.dark}><rect x="61" y="36" width="8" height="8" /><rect x="60" y="38" width="10" height="4" /><rect x="63" y="35" width="4" height="10" /><rect x="64" y="34" width="2" height="12" /><rect x="59" y="39" width="12" height="2" /></g>
      <rect x="62" y="37" width="2" height="2" fill="#fff" />
    </>
  );
}

function Sort() {
  const tubes: string[][] = [[C.red, C.red, C.gold, C.blue], [C.blue, C.gold, C.red], [C.gold, C.blue], []];
  return (
    <>
      {tubes.map((t, i) => {
        const x = 30 + i * 28;
        return (
          <g key={i}>
            <path d={`M${x} 14v46a10 10 0 0 0 20 0v-46`} fill="rgba(12,12,44,.5)" stroke="#fff" strokeWidth="2" opacity=".9" />
            <rect x={x - 2} y="12" width="24" height="3" fill="#fff" opacity=".9" />
            {t.map((c, k) => (
              <g key={k}><circle cx={x + 10} cy={61 - k * 13} r="6.5" fill={c} /><circle cx={x + 8} cy={59 - k * 13} r="2" fill="#fff" opacity=".55" /></g>
            ))}
          </g>
        );
      })}
      {/* ball in flight to the empty tube */}
      <path d="M96 22 Q110 -2 124 8" fill="none" stroke="#fff" strokeWidth="1.5" strokeDasharray="3 3" opacity=".6" />
      <circle cx="124" cy="9" r="6.5" fill={C.green} /><circle cx="122" cy="7" r="2" fill="#fff" opacity=".55" />
    </>
  );
}

const ART: Record<string, () => React.JSX.Element> = { blocks: Blocks, bricks: Bricks, mines: Mines, sort: Sort };

export default function GameLogo({ id, name }: { id: string; name: string }) {
  const Art = ART[id];
  if (!Art) return null;
  return (
    <svg className="glogo" viewBox="0 0 160 80" role="img" aria-label={`${name} logo`} shapeRendering={id === "sort" ? "geometricPrecision" : "crispEdges"}>
      <Art />
    </svg>
  );
}
