import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { getMint, getOrCreateAssociatedTokenAccount, transferChecked } from "@solana/spl-token";
import bs58 from "bs58";
import { sql } from "./db";
import { previousWeekStart } from "./weeks";

/** Prize share per rank (sums to 100). Rank 1 first. */
export const SPLIT = [30, 20, 15, 10, 8, 6, 4, 3, 2, 2];

export async function runWeeklyPayout(opts: { dryRun: boolean; week?: string }) {
  const week = opts.week ?? previousWeekStart();
  const pool = Number(process.env.WEEKLY_PRIZE_POOL ?? 0);

  // 1) Snapshot winners. UNIQUE(week_start, rank) + ON CONFLICT DO NOTHING => re-runs never duplicate.
  const top = await sql`select * from weekly_leaderboard(${week}::date, 10)`;
  if (!opts.dryRun) {
    for (const r of top) {
      const amount = (pool * SPLIT[Number(r.rank) - 1]) / 100;
      await sql`insert into weekly_payouts (week_start, rank, wallet, points, amount)
                values (${week}, ${r.rank}, ${r.wallet}, ${r.points}, ${amount})
                on conflict (week_start, rank) do nothing`;
    }
  }
  if (opts.dryRun) {
    return { week, dryRun: true, plan: top.map((r) => ({ rank: Number(r.rank), wallet: r.wallet,
      points: Number(r.points), amount: (pool * SPLIT[Number(r.rank) - 1]) / 100 })) };
  }

  // 2) Send. Only 'pending'/'failed' rows; a row stuck in 'sending' needs a manual on-chain check.
  const conn = new Connection(process.env.SOLANA_RPC_URL!, "confirmed");
  const payer = Keypair.fromSecretKey(bs58.decode(process.env.TREASURY_SECRET_KEY!));
  const mint = new PublicKey(process.env.HASHRUSH_MINT!);
  const mintInfo = await conn.getAccountInfo(mint);
  if (!mintInfo) throw new Error("mint not found");
  const programId = mintInfo.owner; // Token or Token-2022 (pump.fun tokens may be either)
  const { decimals } = await getMint(conn, mint, "confirmed", programId);
  const from = await getOrCreateAssociatedTokenAccount(conn, payer, mint, payer.publicKey, false, "confirmed", undefined, programId);

  const rows = await sql`select * from weekly_payouts where week_start = ${week} and status in ('pending','failed') order by rank`;
  const results = [];
  for (const row of rows) {
    // claim the row first so a crash after sending can never cause a second transfer
    const claimed = await sql`update weekly_payouts set status='sending' where id=${row.id} and status in ('pending','failed') returning id`;
    if (!claimed.length) continue;
    try {
      const to = await getOrCreateAssociatedTokenAccount(conn, payer, mint, new PublicKey(row.wallet), true, "confirmed", undefined, programId);
      const raw = BigInt(Math.round(Number(row.amount) * 10 ** decimals));
      const sig = await transferChecked(conn, payer, from.address, mint, to.address, payer, raw, decimals, [], undefined, programId);
      await sql`update weekly_payouts set status='sent', tx_signature=${sig}, error=null where id=${row.id}`;
      results.push({ rank: row.rank, sig });
    } catch (e: any) {
      // 'failed' = safe to retry only if you confirmed nothing landed; the next run retries automatically
      await sql`update weekly_payouts set status='failed', error=${String(e?.message ?? e)} where id=${row.id}`;
      results.push({ rank: row.rank, error: String(e?.message ?? e) });
    }
  }
  return { week, dryRun: false, results };
}
