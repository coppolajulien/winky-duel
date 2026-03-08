import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});
const KEY = "private-duels";

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
    const { duelId } = (await req.json()) as { duelId: string };
    if (!duelId) {
      return NextResponse.json({ error: "Missing duelId" }, { status: 400 });
    }
    await redis.sadd(KEY, duelId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to store" }, { status: 500 });
  }
}
