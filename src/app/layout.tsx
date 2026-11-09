import "./globals.css";
import Header from "@/components/Header";

export const metadata = { title: "HashRush — play, win points, get paid", description: "Win games, climb the weekly leaderboard, top 10 get paid in $HASHRUSH every Monday." };
export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Rajdhani:wght@600;700&display=swap" rel="stylesheet" />
      </head>
      <body><Header /><div className="wrap">{children}</div></body>
    </html>
  );
}
