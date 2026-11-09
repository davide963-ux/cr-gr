// Pixel-art room: a player mining hashes at a PC. Pure SVG + CSS animation (see .room-svg in globals.css).
const rows = [18, 26, 10, 22, 14, 24]; // widths of the scrolling "hash" bars on the monitor
const stars: [number, number, number][] = [[18, 14, 0], [26, 24, 1.2], [40, 16, 0.6], [22, 31, 2], [44, 28, 1.7], [32, 12, 2.4]];

export default function Room() {
  return (
    <svg className="room-svg" viewBox="0 0 160 90" shapeRendering="crispEdges" role="img" aria-label="A player mining hashes at a computer">
      <defs><clipPath id="scr"><rect x="106" y="26" width="32" height="19" /></clipPath></defs>

      {/* wall + stripes */}
      <rect width="160" height="64" fill="#2a2a5c" />
      {[0, 32, 64, 96, 128].map((x) => <rect key={x} x={x} y="0" width="16" height="64" fill="#2e2e63" />)}
      <rect y="3" width="160" height="1" fill="#8a5cff" className="neon" />
      <rect y="62" width="160" height="2" fill="#1a1a3e" />

      {/* window with night sky */}
      <rect x="12" y="8" width="38" height="30" fill="#4a3322" />
      <rect x="14" y="10" width="34" height="26" fill="#0b1840" />
      {stars.map(([x, y, d], i) => <rect key={i} x={x} y={y} width="1" height="1" fill="#fff" className="tw" style={{ animationDelay: `${d}s` }} />)}
      <rect x="38" y="13" width="5" height="5" fill="#ffe9a8" /><rect x="39" y="13" width="3" height="5" fill="#fff6d6" />
      <rect x="30" y="10" width="2" height="26" fill="#4a3322" /><rect x="14" y="22" width="34" height="2" fill="#4a3322" />

      {/* poster */}
      <rect x="70" y="10" width="20" height="26" fill="#1a1a3e" /><rect x="71" y="11" width="18" height="24" fill="#ff9a1f" />
      <rect x="71" y="23" width="18" height="12" fill="#8a5cff" />
      <text x="80" y="21" textAnchor="middle" fontSize="6" fontFamily="'Pixelify Sans', monospace" fontWeight="700" fill="#1a1a3e">#A3F</text>
      <text x="80" y="31" textAnchor="middle" fontSize="4" fontFamily="'Pixelify Sans', monospace" fill="#fff">RUSH</text>

      {/* clock */}
      <circle cx="97" cy="14" r="6" fill="#e9e4d4" stroke="#4a3322" strokeWidth="1.5" />
      <rect x="96.5" y="9.5" width="1" height="5" fill="#1a1a3e" />
      <rect x="97" y="14" width="1" height="4" fill="#ff5470" className="sec" style={{ transformOrigin: "97.5px 14.5px" }} />

      {/* floor */}
      <rect y="64" width="160" height="26" fill="#6d4a2b" />
      {[70, 76, 82, 88].map((y) => <rect key={y} y={y} width="160" height="1" fill="#59391f" />)}
      {[24, 64, 112, 140].map((x) => <rect key={x} x={x} y="64" width="1" height="6" fill="#59391f" />)}
      {[44, 92, 128].map((x) => <rect key={x} x={x} y="70" width="1" height="6" fill="#59391f" />)}
      <rect x="8" y="80" width="40" height="8" fill="#8a2d52" /><rect x="10" y="82" width="36" height="4" fill="#b83c6b" />

      {/* gaming chair (behind the player) */}
      <rect x="39" y="38" width="7" height="28" fill="#a82350" /><rect x="40" y="39" width="5" height="26" fill="#d63b6b" />
      <rect x="55" y="66" width="3" height="12" fill="#2a2a3e" />
      <rect x="46" y="78" width="20" height="2" fill="#2a2a3e" />
      <rect x="46" y="80" width="3" height="2" fill="#111" /><rect x="56" y="80" width="3" height="2" fill="#111" /><rect x="63" y="80" width="3" height="2" fill="#111" />

      {/* player: legs, torso, head (bobbing) */}
      <rect x="56" y="57" width="14" height="5" fill="#3b4cc0" /><rect x="66" y="62" width="4" height="16" fill="#3b4cc0" />
      <rect x="66" y="78" width="9" height="3" fill="#eee" /><rect x="66" y="80" width="9" height="1" fill="#ff9a1f" />
      <rect x="47" y="62" width="21" height="4" fill="#d63b6b" />
      <g className="bob">
        <rect x="48" y="40" width="13" height="19" fill="#8a5cff" /><rect x="48" y="40" width="13" height="3" fill="#a384ff" />
        <rect x="52" y="39" width="8" height="2" fill="#f2b98a" />
        <rect x="50" y="26" width="13" height="13" fill="#f2b98a" />
        <rect x="49" y="23" width="15" height="6" fill="#2a1a4a" /><rect x="49" y="26" width="3" height="9" fill="#2a1a4a" />
        <rect x="49" y="25" width="15" height="2" fill="#34e5ff" />
        <rect x="52" y="30" width="4" height="7" fill="#34e5ff" className="glow" /><rect x="53" y="31" width="2" height="5" fill="#0c5a66" />
        <rect x="60" y="31" width="2" height="2" fill="#1a1a3e" className="blink" />
        <rect x="63" y="33" width="2" height="2" fill="#e0a070" /><rect x="60" y="36" width="4" height="1" fill="#b86a50" />
      </g>

      {/* desk */}
      <rect x="66" y="52" width="88" height="3" fill="#a06a35" /><rect x="66" y="52" width="88" height="1" fill="#c48a4d" />
      <rect x="70" y="55" width="80" height="23" fill="#7a4e26" />
      <rect x="116" y="58" width="30" height="8" fill="#6a421f" /><rect x="116" y="68" width="30" height="8" fill="#6a421f" />
      <rect x="129" y="61" width="4" height="1" fill="#d9a35b" /><rect x="129" y="71" width="4" height="1" fill="#d9a35b" />
      <rect x="72" y="78" width="3" height="8" fill="#5c3a1a" /><rect x="145" y="78" width="3" height="8" fill="#5c3a1a" />

      {/* monitor */}
      <rect x="103" y="23" width="38" height="26" fill="#15152e" /><rect x="103" y="23" width="38" height="1" fill="#2a2a55" />
      <rect x="106" y="26" width="32" height="19" fill="#06232b" />
      <g clipPath="url(#scr)">
        <g className="scroll">
          {[...rows, ...rows].map((w, i) => (
            <rect key={i} x="108" y={28 + i * 3} width={w} height="1" fill={i % 3 === 0 ? "#3ddc84" : "#34e5ff"} />
          ))}
        </g>
        <rect x="108" y="43" width="2" height="1" fill="#fff" className="cur" />
        <rect x="106" y="26" width="32" height="19" fill="#34e5ff" opacity="0.06" className="flick" />
      </g>
      <rect x="120" y="49" width="4" height="3" fill="#15152e" /><rect x="114" y="51" width="16" height="1" fill="#15152e" />
      <text className="pop p1" x="132" y="21" fontSize="5" fontFamily="'Pixelify Sans', monospace" fontWeight="700" fill="#3ddc84">+10</text>
      <text className="pop p2" x="116" y="21" fontSize="5" fontFamily="'Pixelify Sans', monospace" fontWeight="700" fill="#ffd24a">+10</text>
      <text className="pop p3" x="124" y="21" fontSize="5" fontFamily="'Pixelify Sans', monospace" fontWeight="700" fill="#34e5ff">WIN</text>

      {/* keyboard, mouse, mug */}
      <rect x="84" y="50" width="19" height="2" fill="#2a2a3e" /><rect x="85" y="50" width="17" height="1" fill="#4a4a6e" className="keys" />
      <rect x="143" y="50" width="4" height="2" fill="#2a2a3e" />
      <rect x="72" y="47" width="6" height="5" fill="#f4f4ff" /><rect x="78" y="48" width="2" height="3" fill="#f4f4ff" /><rect x="73" y="48" width="4" height="1" fill="#6b3a1a" />
      <rect x="74" y="43" width="1" height="3" fill="#fff" className="steam s1" /><rect x="76" y="43" width="1" height="3" fill="#fff" className="steam s2" />

      {/* arms + typing hands (in front of desk) */}
      <rect x="52" y="43" width="6" height="10" fill="#6f45e0" />
      <rect x="56" y="47" width="28" height="4" fill="#8a5cff" />
      <rect x="82" y="47" width="5" height="3" fill="#f2b98a" className="hand a" />
      <rect x="86" y="47" width="5" height="3" fill="#f2b98a" className="hand b" />
    </svg>
  );
}
