/** Normalise "@Name", "https://x.com/Name" or "name" -> "Name"; null if not a valid X handle. */
export function parseXHandle(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const m = input.trim().replace(/^https?:\/\/(www\.)?(x|twitter)\.com\//i, "").replace(/^@/, "").split(/[/?]/)[0];
  return /^[A-Za-z0-9_]{1,15}$/.test(m) ? m : null;
}
