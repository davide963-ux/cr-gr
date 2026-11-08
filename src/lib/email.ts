import { createHash, randomBytes } from "node:crypto";
import { sql } from "./db";

export function parseEmail(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const e = input.trim().toLowerCase();
  return e.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) ? e : null;
}

export const hashToken = (t: string) => createHash("sha256").update(t).digest("hex");

const MAX_LINKS_PER_HOUR = 5;

/** Creates a 30-min single-use token and emails the link. Returns false if rate-limited. */
export async function sendMagicLink(playerId: string, email: string): Promise<boolean> {
  const [{ n }] = await sql`select count(*)::int as n from email_tokens where player_id = ${playerId} and created_at > now() - interval '1 hour'`;
  if (n >= MAX_LINKS_PER_HOUR) return false;

  const token = randomBytes(32).toString("base64url");
  await sql`insert into email_tokens (token_hash, player_id, expires_at) values (${hashToken(token)}, ${playerId}, now() + interval '30 minutes')`;
  const link = `${process.env.APP_URL ?? "http://localhost:3000"}/verify?token=${token}`;

  if (!process.env.RESEND_API_KEY) { console.log(`[dev] magic link for ${email}: ${link}`); return true; }
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM, to: email, subject: "Confirm your HashRush email",
      text: `Click to confirm your email and sign in to HashRush (valid 30 minutes):\n\n${link}\n\nIf you didn't request this, ignore this email.`,
    }),
  });
  if (!r.ok) throw new Error(`email send failed: ${r.status}`);
  return true;
}
