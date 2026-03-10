import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createPublicClient, http } from "viem";
import { appChain } from "@/lib/chain";
import { WINKY_DUEL_ADDRESS, WINKY_DUEL_ABI } from "@/lib/constants";

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});
const KEY = "private-duels";

const publicClient = createPublicClient({
  chain: appChain,
  transport: http(),
});

// Simple rate limit: max 10 POST requests per IP per minute
async function isRateLimited(ip: string): Promise<boolean> {
  const key = `rl:${ip}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, 60);
  return count > 10;
}

/** GET — return all private duel IDs */
export async function GET() {
  try {
    const ids: string[] = await redis.smembers(KEY);
    return NextResponse.json({ ids });
  } catch {
    return NextResponse.json({ ids: [] });
  }
}

/** POST { duelId: string } — mark a duel as private */
export async function POST(req: Request) {
  try {
    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (await isRateLimited(ip)) {
      return NextResponse.json({ error: "Rate limited" }, { status: 429 });
    }

    const { duelId } = (await req.json()) as { duelId: string };
    if (!duelId || !/^\d+$/.test(duelId)) {
      return NextResponse.json({ error: "Invalid duelId" }, { status: 400 });
    }

    // Verify duel exists on-chain and is in Open state (status 0)
    try {
      const result = await publicClient.readContract({
        address: WINKY_DUEL_ADDRESS,
        abi: WINKY_DUEL_ABI,
        functionName: "getDuel",
        args: [BigInt(duelId)],
      });

      const duel = result as { status: number };
      if (Number(duel.status) !== 0) {
        return NextResponse.json({ error: "Duel is not open" }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: "Duel not found" }, { status: 404 });
    }

    await redis.sadd(KEY, duelId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to store" }, { status: 500 });
  }
}
