/** Monday 00:00 UTC of the week containing `d`, as YYYY-MM-DD. */
export function weekStart(d: Date = new Date()): string {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dow = (x.getUTCDay() + 6) % 7; // Mon=0 … Sun=6
  x.setUTCDate(x.getUTCDate() - dow);
  return x.toISOString().slice(0, 10);
}

/** The week that just ended (what the Monday payout rewards). */
export function previousWeekStart(d: Date = new Date()): string {
  const x = new Date(weekStart(d) + "T00:00:00Z");
  x.setUTCDate(x.getUTCDate() - 7);
  return x.toISOString().slice(0, 10);
}
