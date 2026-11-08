import { sql } from "@/lib/db";
import { parseEmail, sendMagicLink } from "@/lib/email";
import { parseXHandle } from "@/lib/x";

export async function POST(req: Request) {
  const body = await req.json();
  const email = parseEmail(body.email), handle = parseXHandle(body.xUsername);
  if (!email) return Response.json({ error: "Enter a valid email" }, { status: 400 });
  if (!handle) return Response.json({ error: "Enter a valid X username" }, { status: 400 });

  const taken = await sql`select 1 from players where lower(x_username) = lower(${handle}) and email_verified_at is not null and email <> ${email}`;
  if (taken.length) return Response.json({ error: "That X username is already registered" }, { status: 409 });

  const existing = await sql`select id, email_verified_at from players where email = ${email}`;
  if (existing[0]?.email_verified_at)
    return Response.json({ error: "Email already registered — use Log in" }, { status: 409 });

  // new account, or re-signup of a still-unverified email (lets them fix a typo in the handle)
  const [p] = await sql`insert into players (email, x_username) values (${email}, ${handle})
                        on conflict (email) do update set x_username = excluded.x_username returning id`;
  if (!(await sendMagicLink(p.id, email))) return Response.json({ error: "Too many emails, try again later" }, { status: 429 });
  return Response.json({ sent: true });
}
