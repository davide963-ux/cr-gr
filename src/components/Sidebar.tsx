"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "./Icon";

const ITEMS = [
  { href: "/", icon: "home", label: "Home" },
  { href: "/play", icon: "game", label: "Games" },
  { href: "/leaderboard", icon: "trophy", label: "Leaderboard" },
  { href: "/#prizes", icon: "gift", label: "Rewards" },
  { href: "/#how", icon: "info", label: "How it works" },
] as const;

export default function Sidebar() {
  const path = usePathname();
  return (
    <aside className="side">
      {ITEMS.map((it) => (
        <Link key={it.label} href={it.href} className={`sbtn ${(it.href === "/" ? path === "/" : it.href.startsWith("/#") ? false : path.startsWith(it.href)) ? "on" : ""}`} title={it.label} aria-label={it.label}>
          <Icon name={it.icon} /><span>{it.label}</span>
        </Link>
      ))}
    </aside>
  );
}
