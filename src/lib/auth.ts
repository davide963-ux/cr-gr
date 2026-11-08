import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import nacl from "tweetnacl";
import bs58 from "bs58";

const COOKIE = "hr_session";
const key = () => new TextEncoder().encode(process.env.SESSION_SECRET!);

export const signInMessage = (nonce: string) => `Sign in to HashRush\nNonce: ${nonce}`;

export function verifyWalletSignature(wallet: string, nonce: string, sigB58: string): boolean {
  try {
    return nacl.sign.detached.verify(
      new TextEncoder().encode(signInMessage(nonce)), bs58.decode(sigB58), bs58.decode(wallet));
  } catch { return false; }
}

export async function setSession(wallet: string) {
  const jwt = await new SignJWT({ wallet }).setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d").sign(key());
  (await cookies()).set(COOKIE, jwt, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 7 * 86400 });
}

/** Returns the signed-in wallet or null. */
export async function getWallet(): Promise<string | null> {
  const t = (await cookies()).get(COOKIE)?.value;
  if (!t) return null;
  try { return (await jwtVerify(t, key())).payload.wallet as string; } catch { return null; }
}
