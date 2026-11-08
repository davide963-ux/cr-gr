import { sql } from "@/lib/db";
import { parseEmail, sendMagicLink } from "@/lib/email";

export async function POST(req: Request) {
  const email = parseEmail((await req.json()).email);
  if (!email) return Response.json({ error: "Enter a valid email" }, { status: 400 });
  const p = await sql`select id from players where email = ${email} and email_verified_at is not null`;
  if (p.length) await sendMagicLink(p[0].id, email);
  return Response.json({ sent: true }); // same answer whether or not the account exists
}
