import { NextResponse } from "next/server";
import {
  getSession,
  saveSession,
  isRateLimited,
  getClientIp,
  GAME_DURATION_MS,
  MIN_BLINK_INTERVAL_MS,
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

    // Validate timestamp
    if (timestamp < 0 || timestamp > GAME_DURATION_MS) {
      return NextResponse.json({ error: "Invalid timestamp" }, { status: 400 });
    }

    // Must be monotonically increasing
    const lastBlink = session.blinks[session.blinks.length - 1];
    if (lastBlink !== undefined && timestamp <= lastBlink) {
      return NextResponse.json({ error: "Non-monotonic timestamp" }, { status: 400 });
    }

    // Enforce minimum interval
    if (lastBlink !== undefined && timestamp - lastBlink < MIN_BLINK_INTERVAL_MS) {
      return NextResponse.json({ error: "Too fast" }, { status: 400 });
    }

    session.blinks.push(timestamp);
    await saveSession(session);

    return NextResponse.json({ ok: true, count: session.blinks.length });
  } catch (err) {
    console.error("game/blink error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
