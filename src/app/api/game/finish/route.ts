import { NextResponse } from "next/server";
import { keccak256, encodePacked } from "viem";
import {
  getSession,
  saveSession,
  redis,
  getSignerAccount,
  isRateLimited,
  getClientIp,
  ACTIVE_KEY,
  SESSION_KEY,
  MIN_GAME_DURATION_MS,
  MIN_BLINK_INTERVAL_MS,
  MAX_BLINKS_PER_SECOND,
  MAX_SCORE,
  GAME_DURATION_MS,
  SERVER_MIN_BLINK_INTERVAL_MS,
} from "../_lib";
import { WINKY_DUEL_ADDRESS } from "@/lib/constants";

export async function POST(req: Request) {
  try {
    const ip = await getClientIp();
    if (await isRateLimited(ip, 30, 60, "finish")) {
      return NextResponse.json({ error: "Rate limited" }, { status: 429 });
    }

    const { sessionId } = (await req.json()) as { sessionId: string };

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    const session = await getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    if (session.finished) {
      return NextResponse.json({ error: "Already finished" }, { status: 400 });
    }

    // Mark finished immediately (anti-double-sign)
    session.finished = true;
    await saveSession(session);

    // ── Client-side timestamp validations ──

    const blinks = session.blinks;

    // 1. Game duration check
    const elapsed = Date.now() - session.startedAt;
    if (elapsed < MIN_GAME_DURATION_MS) {
      await cleanup(session.sessionId, session.player);
      return NextResponse.json({ error: "Game too short" }, { status: 400 });
    }

    // 2. Validate client blink intervals
    for (let i = 1; i < blinks.length; i++) {
      if (blinks[i] - blinks[i - 1] < MIN_BLINK_INTERVAL_MS) {
        await cleanup(session.sessionId, session.player);
        return NextResponse.json({ error: "Invalid blink pattern" }, { status: 400 });
      }
    }

    // 3. Check monotonic client timestamps
    for (let i = 1; i < blinks.length; i++) {
      if (blinks[i] <= blinks[i - 1]) {
        await cleanup(session.sessionId, session.player);
        return NextResponse.json({ error: "Non-monotonic blinks" }, { status: 400 });
      }
    }

    // 4. Max blinks per 1s window (client timestamps)
    for (let i = 0; i < blinks.length; i++) {
      const windowEnd = blinks[i] + 1000;
      let count = 0;
      for (let j = i; j < blinks.length && blinks[j] < windowEnd; j++) {
        count++;
      }
      if (count > MAX_BLINKS_PER_SECOND) {
        await cleanup(session.sessionId, session.player);
        return NextResponse.json({ error: "Too many blinks in window" }, { status: 400 });
      }
    }

    // 5. No blinks past game duration
    if (blinks.length > 0 && blinks[blinks.length - 1] > GAME_DURATION_MS) {
      await cleanup(session.sessionId, session.player);
      return NextResponse.json({ error: "Blinks past game end" }, { status: 400 });
    }

    // ── Server-side real-time validations (anti-bot) ──

    const serverBlinks = session.serverBlinks ?? [];

    // 6. Server blink count must match client blink count
    if (serverBlinks.length !== blinks.length) {
      await cleanup(session.sessionId, session.player);
      return NextResponse.json({ error: "Blink count mismatch" }, { status: 400 });
    }

    // 7. Validate server-side blink intervals (real time between API calls)
    for (let i = 1; i < serverBlinks.length; i++) {
      if (serverBlinks[i] - serverBlinks[i - 1] < SERVER_MIN_BLINK_INTERVAL_MS) {
        await cleanup(session.sessionId, session.player);
        return NextResponse.json({ error: "Server interval too fast" }, { status: 400 });
      }
    }

    // 8. Correlation check: real time span must cover at least 50% of client time span
    //    (bot sending blinks for t=0..30000ms but server sees them in 5s → fake)
    if (blinks.length > 1 && serverBlinks.length > 1) {
      const clientSpan = blinks[blinks.length - 1] - blinks[0];
      const serverSpan = serverBlinks[serverBlinks.length - 1] - serverBlinks[0];
      if (clientSpan > 0 && serverSpan < clientSpan * 0.5) {
        await cleanup(session.sessionId, session.player);
        return NextResponse.json({ error: "Timing mismatch" }, { status: 400 });
      }
    }

    // ── Compute score ──
    const score = Math.min(blinks.length, MAX_SCORE);

    // ── Sign the score ──
    const signer = getSignerAccount();
    const messageHash = keccak256(
      encodePacked(
        ["address", "uint32", "uint256", "address"],
        [
          session.player as `0x${string}`,
          score,
          BigInt(session.nonce),
          WINKY_DUEL_ADDRESS,
        ]
      )
    );
    const signature = await signer.signMessage({ message: { raw: messageHash } });

    // Cleanup active lock
    await redis.del(ACTIVE_KEY(session.player));

    return NextResponse.json({
      score,
      nonce: session.nonce,
      signature,
      player: session.player,
    });
  } catch (err) {
    console.error("game/finish error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

async function cleanup(sessionId: string, player: string) {
  await redis.del(SESSION_KEY(sessionId));
  await redis.del(ACTIVE_KEY(player));
}
