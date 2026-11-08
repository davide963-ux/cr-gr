import { sql } from "@/lib/db";
import { setSession, verifyWalletSignature } from "@/lib/auth";

export async function POST(req: Request) {
  const { wallet, signature } = await req.json();
  // consume the nonce atomically: one signature = one login
  const rows = await sql`delete from auth_nonces where wallet = ${wallet} and expires_at > now() returning nonce`;
  if (!rows.length || !verifyWalletSignature(wallet, rows[0].nonce, signature))
    return Response.json({ error: "invalid signature" }, { status: 401 });
  await sql`insert into players (wallet) values (${wallet}) on conflict do nothing`;
  await setSession(wallet);
  return Response.json({ wallet });
}
