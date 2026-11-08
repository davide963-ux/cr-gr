import { runWeeklyPayout } from "../src/lib/payout";
const dryRun = process.env.PAYOUT_DRY_RUN !== "false";
runWeeklyPayout({ dryRun, week: process.argv[2] }).then((r) => console.log(JSON.stringify(r, null, 2)));
