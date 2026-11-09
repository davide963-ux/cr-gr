import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

export const metadata = { title: "HashRush — play, win points, get paid", description: "Win games, climb the weekly leaderboard, top 10 get paid in $HASHRUSH every Monday." };
export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@500;700&family=Rubik:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Topbar />
        <Sidebar />
        <div className="main">{children}</div>
        <footer className="foot">
          <div className="foot-in">
            <div><h4 className="px">PLAY</h4><a href="/play/blocks">Block Stack</a><a href="/play/bricks">Brick Chaos</a><a href="/play/mines">Minefield</a><a href="/play/sort">Color Sort</a><a href="/leaderboard">Leaderboard</a></div>
            <div><h4 className="px">INFORMATION</h4><a href="/#how">How it works</a><a href="/#prizes">Rewards</a></div>
            <div><h4 className="px">PAYOUTS</h4><span>Every Monday 00:00 UTC the top 10 of the week are contacted on X and paid in $HASHRUSH.</span></div>
          </div>
          <p>© HashRush {new Date().getFullYear()}. Free to play.</p>
        </footer>
      </body>
    </html>
  );
}
