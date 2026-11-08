import { sql } from "@/lib/db";
import { setSession } from "@/lib/auth";
import { parseXHandle } from "@/lib/x";

export async function POST(req: Request) {
  const handle = parseXHandle((await req.json()).xUsername);
  if (!handle) return Response.json({ error: "Enter a valid X username" }, { status: 400 });
  const rows = await sql`insert into players (x_username) values (${handle}) on conflict do nothing returning id`;
  if (!rows.length) return Response.json({ error: "That X username is already registered" }, { status: 409 });
  await setSession(rows[0].id);
  return Response.json({ x_username: handle });
}
