import { NextResponse } from "next/server";
import {
  getSession,
  saveSession,
  isRateLimited,
  getClientIp,
  GAME_DURATION_MS,
  MIN_BLINK_INTERVAL_MS,
  SERVER_MIN_BLINK_INTERVAL_MS,
  MAX_CLOCK_DRIFT_MS,
  GAME_WINDOW_BUFFER_MS,
} from "../_lib";

export async function POST(req: Request) {
  try {
    const ip = await getClientIp();
    if (await isRateLimited(ip, 200, 60, "blink")) {
      return NextResponse.json({ error: "Rate limited" }, { status: 429 });
    }

    const { sessionId, timestamp } = (await req.json()) as {
      sessionId: string;
      timestamp: number;
    };

    if (!sessionId || typeof timestamp !== "number") {
      return NextResponse.json({ error: "Invalid params" }, { status: 400 });
    }

    const session = await getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    if (session.finished) {
      return NextResponse.json({ error: "Session finished" }, { status: 400 });
    }

    // ── Client-side timestamp validation ──

    // Validate client timestamp is within game window
    if (timestamp < 0 || timestamp > GAME_DURATION_MS) {
      return NextResponse.json({ error: "Invalid timestamp" }, { status: 400 });
    }

    // Must be monotonically increasing
    const lastBlink = session.blinks[session.blinks.length - 1];
    if (lastBlink !== undefined && timestamp <= lastBlink) {
      return NextResponse.json({ error: "Non-monotonic timestamp" }, { status: 400 });
    }

    // Enforce minimum interval (client-reported)
    if (lastBlink !== undefined && timestamp - lastBlink < MIN_BLINK_INTERVAL_MS) {
      return NextResponse.json({ error: "Too fast" }, { status: 400 });
    }

    // ── Server-side real-time validation (anti-bot) ──

    const now = Date.now();
    const serverElapsed = now - session.startedAt;

    // Don't accept blinks after game window + buffer
    if (serverElapsed > GAME_DURATION_MS + GAME_WINDOW_BUFFER_MS) {
      return NextResponse.json({ error: "Game window closed" }, { status: 400 });
    }

    // Client timestamp must not be too far ahead of real elapsed time
    // (bot would send timestamp=25000 when only 2s have actually passed)
    if (timestamp > serverElapsed + MAX_CLOCK_DRIFT_MS) {
      return NextResponse.json({ error: "Clock drift" }, { status: 400 });
    }

    // Enforce real-time minimum interval between blink API calls
    // (prevents bots from sending all blinks in rapid succession)
    const serverBlinks = session.serverBlinks ?? [];
    const lastServerBlink = serverBlinks[serverBlinks.length - 1];
    if (lastServerBlink !== undefined && serverElapsed - lastServerBlink < SERVER_MIN_BLINK_INTERVAL_MS) {
      return NextResponse.json({ error: "Too fast (server)" }, { status: 400 });
    }

    // ── Store both client and server timestamps ──

    session.blinks.push(timestamp);
    if (!session.serverBlinks) session.serverBlinks = [];
    session.serverBlinks.push(serverElapsed);
    await saveSession(session);

    return NextResponse.json({ ok: true, count: session.blinks.length });
  } catch (err) {
    console.error("game/blink error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
