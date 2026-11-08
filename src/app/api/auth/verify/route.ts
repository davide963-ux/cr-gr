import { sql } from "@/lib/db";
import { hashToken } from "@/lib/email";
import { setSession } from "@/lib/auth";

// POST (from the /verify page button, so email scanners that prefetch links can't burn the token)
export async function POST(req: Request) {
  const { token } = await req.json();
  if (typeof token !== "string") return Response.json({ error: "bad token" }, { status: 400 });
  const used = await sql`update email_tokens set used_at = now()
                         where token_hash = ${hashToken(token)} and used_at is null and expires_at > now() returning player_id`;
  if (!used.length) return Response.json({ error: "Link invalid or expired — request a new one" }, { status: 401 });
  try {
    await sql`update players set email_verified_at = coalesce(email_verified_at, now()) where id = ${used[0].player_id}`;
  } catch { // verified unique index: someone verified this X handle first
    return Response.json({ error: "That X username was just taken — sign up again with another" }, { status: 409 });
  }
  await setSession(used[0].player_id);
  return Response.json({ ok: true });
}
