"use client";
import { useEffect, useState } from "react";

export type Me = { x_username: string | null; points?: number; wins?: number; rank?: number | null; gamesToday?: number; dailyLimit?: number; players?: number };

/** Current player (null = not logged in, undefined = loading). Re-fetches on the "hr:refresh" window event. */
export function useMe(): Me | undefined {
  const [me, setMe] = useState<Me | undefined>(undefined);
  useEffect(() => {
    const load = () => fetch("/api/auth/me").then((r) => r.json()).then(setMe).catch(() => setMe({ x_username: null }));
    load();
    window.addEventListener("hr:refresh", load);
    return () => window.removeEventListener("hr:refresh", load);
  }, []);
  return me;
}
