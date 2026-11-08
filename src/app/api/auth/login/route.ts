import { sql } from "@/lib/db";
import { setSession } from "@/lib/auth";
import { parseXHandle } from "@/lib/x";

// Login = enter your X handle. New handle -> account is created; existing handle -> you're logged in.
export async function POST(req: Request) {
  const handle = parseXHandle((await req.json()).xUsername);
  if (!handle) return Response.json({ error: "Enter a valid X username" }, { status: 400 });
  const [p] = await sql`insert into players (x_username) values (${handle})
                        on conflict (lower(x_username)) do update set x_username = players.x_username
                        returning id, x_username`;
  await setSession(p.id);
  return Response.json({ x_username: p.x_username });
}
