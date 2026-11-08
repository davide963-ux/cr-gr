import { sql } from "@/lib/db";
import { getPlayerId } from "@/lib/auth";
export async function GET() {
  const id = await getPlayerId();
  const r = id ? await sql`select x_username from players where id = ${id}` : [];
  return Response.json({ x_username: r[0]?.x_username ?? null });
}
