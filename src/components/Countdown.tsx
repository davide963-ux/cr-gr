"use client";
import { useEffect, useState } from "react";

export default function Countdown({ to, compact }: { to: string; compact?: boolean }) {
  const [ms, setMs] = useState<number | null>(null);
  useEffect(() => {
    const t = () => setMs(Math.max(0, new Date(to).getTime() - Date.now()));
    t(); const id = setInterval(t, 1000); return () => clearInterval(id);
  }, [to]);
  const s = Math.floor((ms ?? 0) / 1000);
  const parts: [string, number][] = [["days", Math.floor(s / 86400)], ["hrs", Math.floor(s / 3600) % 24], ["min", Math.floor(s / 60) % 60], ["sec", s % 60]];
  return (
    <div className={`count ${compact ? "compact" : ""}`}>
      {parts.map(([l, v]) => <div key={l}><b>{ms === null ? "--" : String(v).padStart(2, "0")}</b><span>{l}</span></div>)}
    </div>
  );
}
