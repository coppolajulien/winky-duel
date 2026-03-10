import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import {
  redis,
  getSession,
  getOnChainNonce,
  isRateLimited,
  getClientIp,
  isValidAddress,
  ACTIVE_KEY,
  SESSION_KEY,
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

    // Check for existing active session
    const existingSessionId = await redis.get<string>(ACTIVE_KEY(player));
    if (existingSessionId) {
      // Check if the session is still valid and in-progress
      const existingSession = await getSession(existingSessionId);
      if (existingSession && !existingSession.finished) {
        const elapsed = Date.now() - existingSession.startedAt;
        // If session is less than 60s old, it's likely still playing
        if (elapsed < 60_000) {
          return NextResponse.json({ error: "Active session exists" }, { status: 409 });
        }
      }
      // Session is stale, finished, or missing — clean it up
      await redis.del(ACTIVE_KEY(player));
      if (existingSessionId) {
        await redis.del(SESSION_KEY(existingSessionId));
      }
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
      serverBlinks: [],
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
