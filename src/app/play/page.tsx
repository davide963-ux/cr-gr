import GameCards from "@/components/GameCards";

export const metadata = { title: "Games — HashRush" };
export default function Hub() {
  return (
    <div className="panel">
      <h2 className="px">GAMES</h2>
      <p className="muted" style={{ marginBottom: 16 }}>Win games to earn points. Points from every game add up on the weekly leaderboard.</p>
      <GameCards />
    </div>
  );
}
