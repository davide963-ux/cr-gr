import { randomBytes } from "node:crypto";
import { sql } from "@/lib/db";
import { signInMessage } from "@/lib/auth";

export async function POST(req: Request) {
  const { wallet } = await req.json();
  if (typeof wallet !== "string" || wallet.length < 32 || wallet.length > 44)
    return Response.json({ error: "bad wallet" }, { status: 400 });
  const nonce = randomBytes(16).toString("hex");
  await sql`insert into auth_nonces (wallet, nonce, expires_at) values (${wallet}, ${nonce}, now() + interval '5 minutes')
            on conflict (wallet) do update set nonce = excluded.nonce, expires_at = excluded.expires_at`;
  return Response.json({ message: signInMessage(nonce) });
}
