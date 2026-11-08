import { sql } from "@/lib/db";
import { setSession, verifyWalletSignature } from "@/lib/auth";
import { parseXHandle } from "@/lib/x";

export async function POST(req: Request) {
  const { wallet, signature, xUsername } = await req.json();
  if (typeof wallet !== "string" || typeof signature !== "string")
    return Response.json({ error: "bad request" }, { status: 400 });

  // 1) check signature against the stored nonce (not consumed yet)
  const n = await sql`select nonce from auth_nonces where wallet = ${wallet} and expires_at > now()`;
  if (!n.length || !verifyWalletSignature(wallet, n[0].nonce, signature))
    return Response.json({ error: "invalid signature" }, { status: 401 });

  // 2) every player must have an X handle; new (or legacy) players must supply one
  const existing = await sql`select x_username from players where wallet = ${wallet}`;
  if (!existing.length) {
    const handle = parseXHandle(xUsername);
    if (!handle) return Response.json({ error: "Enter a valid X username", needsHandle: true }, { status: 400 });
    await sql`insert into players (wallet, x_username) values (${wallet}, ${handle}) on conflict do nothing`;
  }

  // 3) consume the nonce atomically: one signature = one login
  const used = await sql`delete from auth_nonces where wallet = ${wallet} and nonce = ${n[0].nonce} returning 1`;
  if (!used.length) return Response.json({ error: "nonce already used" }, { status: 401 });
  await setSession(wallet);
  return Response.json({ wallet });
}
