import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});
const KEY = "private-duels";

// Simple rate limit: max 30 POST requests per IP per minute
async function isRateLimited(ip: string): Promise<boolean> {
  const key = `rl:${ip}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, 60);
  return count > 30;
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
    await redis.sadd(KEY, duelId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to store" }, { status: 500 });
  }
}
