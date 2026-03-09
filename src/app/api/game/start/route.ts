import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import {
  redis,
  getOnChainNonce,
  isRateLimited,
  getClientIp,
  isValidAddress,
  ACTIVE_KEY,
  saveSession,
  type GameSession,
} from "../_lib";

export async function POST(req: Request) {
  try {
    const ip = await getClientIp();
    if (await isRateLimited(ip, 30, 60, "start")) {
      return NextResponse.json({ error: "Rate limited" }, { status: 429 });
    }

    const { player } = (await req.json()) as { player: string };

    if (!player || !isValidAddress(player)) {
      return NextResponse.json({ error: "Invalid player address" }, { status: 400 });
    }

    // One active session per player
    const activeSession = await redis.get(ACTIVE_KEY(player));
    if (activeSession) {
      return NextResponse.json({ error: "Active session exists" }, { status: 409 });
    }

    // Read nonce from contract
    const nonce = await getOnChainNonce(player);

    // Create session
    const sessionId = randomBytes(16).toString("hex");
    const session: GameSession = {
      sessionId,
      player: player.toLowerCase(),
      nonce: Number(nonce),
      startedAt: Date.now(),
      blinks: [],
      finished: false,
    };

    await saveSession(session);
    // Lock: 1 session per player (5 min TTL)
    await redis.set(ACTIVE_KEY(player), sessionId, { ex: 300 });

    return NextResponse.json({ sessionId, nonce: Number(nonce) });
  } catch (err) {
    console.error("game/start error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
