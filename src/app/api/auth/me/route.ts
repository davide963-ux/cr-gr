import { getWallet } from "@/lib/auth";
export async function GET() { return Response.json({ wallet: await getWallet() }); }
