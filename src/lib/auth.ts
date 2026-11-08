import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE = "hr_session";
const key = () => new TextEncoder().encode(process.env.SESSION_SECRET!);

export async function setSession(playerId: string) {
  const jwt = await new SignJWT({ pid: playerId }).setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("90d").sign(key());
  (await cookies()).set(COOKIE, jwt, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 90 * 86400 });
}
export async function clearSession() { (await cookies()).delete(COOKIE); }

/** Signed-in player id, or null. */
export async function getPlayerId(): Promise<string | null> {
  const t = (await cookies()).get(COOKIE)?.value;
  if (!t) return null;
  try { return (await jwtVerify(t, key())).payload.pid as string; } catch { return null; }
}
