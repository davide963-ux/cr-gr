import { runWeeklyPayout } from "@/lib/payout";

export const maxDuration = 60;
// Vercel Cron calls this every Monday 00:05 UTC (vercel.json) with Authorization: Bearer $CRON_SECRET
export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`)
    return Response.json({ error: "unauthorized" }, { status: 401 });
  const dryRun = process.env.PAYOUT_DRY_RUN !== "false";
  return Response.json(await runWeeklyPayout({ dryRun }));
}
