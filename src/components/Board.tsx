import { SPLIT } from "@/lib/prizes";

export default function Board({ rows, prizes = true }: { rows: Record<string, any>[]; prizes?: boolean }) {
  if (!rows.length) return <div className="empty">No scores yet this week.<br />Be the first on the board! 🏁</div>;
  return (
    <ol className="lb">
      {rows.map((r, i) => (
        <li key={String(r.x_username)}>
          <span className="rk">{i < 3 ? ["🥇", "🥈", "🥉"][i] : `#${i + 1}`}</span>
          <span className="who">@{r.x_username}<small>{String(r.wins)} wins</small></span>
          <span className="sc">{String(r.points)} PTS{prizes && i < 10 && <span className="prize">{SPLIT[i]}% of pool</span>}</span>
        </li>
      ))}
    </ol>
  );
}
