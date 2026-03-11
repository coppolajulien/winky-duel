import { NextResponse } from "next/server";
import { redis, isRateLimited, getClientIp } from "@/app/api/game/_lib";

interface InviteCode {
  status: "available" | "used";
  usedAt?: number;
}

export async function POST(req: Request) {
  try {
    const ip = await getClientIp();
    if (await isRateLimited(ip, 10, 60, "invite")) {
      return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
    }

    const body = await req.json();
    const code = (body.code ?? "").trim().toUpperCase();

    if (!code || code.length < 4) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }

    const key = `invite:code:${code}`;
    const data = await redis.get<InviteCode>(key);

    if (!data) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }

    // If already used, still accept (user may have lost localStorage)
    if (data.status === "used") {
      return NextResponse.json({ ok: true });
    }

    // Mark as used on first validation
    await redis.set(key, { status: "used", usedAt: Date.now() });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Invite validate error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
