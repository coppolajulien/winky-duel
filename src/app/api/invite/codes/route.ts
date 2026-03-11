import { NextResponse } from "next/server";
import { redis } from "@/app/api/game/_lib";
import crypto from "crypto";

const ADMIN_ADDRESS = (process.env.NEXT_PUBLIC_ADMIN_ADDRESS ?? "").toLowerCase();

interface InviteCode {
  status: "available" | "used";
  usedAt?: number;
}

function generateCode(): string {
  // 8-char alphanumeric uppercase (no ambiguous chars: 0/O, 1/I/L)
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = crypto.randomBytes(8);
  return Array.from(bytes)
    .map((b) => chars[b % chars.length])
    .join("");
}

function isAdmin(req: Request): boolean {
  const addr = req.headers.get("x-wallet-address") ?? "";
  return addr.toLowerCase() === ADMIN_ADDRESS;
}

// GET — list all invite codes (admin only)
export async function GET(req: Request) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const codes: { code: string; status: string; usedAt?: number }[] = [];
    let cursor = 0;

    do {
      const [nextCursor, keys] = await redis.scan(cursor, {
        match: "invite:code:*",
        count: 100,
      });
      cursor = Number(nextCursor);

      if (keys.length > 0) {
        const pipeline = redis.pipeline();
        for (const key of keys) {
          pipeline.get(key);
        }
        const results = await pipeline.exec<(InviteCode | null)[]>();

        for (let i = 0; i < keys.length; i++) {
          const data = results[i];
          const code = (keys[i] as string).replace("invite:code:", "");
          codes.push({
            code,
            status: data?.status ?? "unknown",
            usedAt: data?.usedAt,
          });
        }
      }
    } while (cursor !== 0);

    // Sort: available first, then by code
    codes.sort((a, b) => {
      if (a.status === "available" && b.status !== "available") return -1;
      if (a.status !== "available" && b.status === "available") return 1;
      return a.code.localeCompare(b.code);
    });

    return NextResponse.json({ codes });
  } catch (err) {
    console.error("Invite codes list error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// POST — generate new invite codes (admin only)
export async function POST(req: Request) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const count = Math.min(Math.max(Number(body.count) || 5, 1), 50);

    const newCodes: string[] = [];
    const pipeline = redis.pipeline();

    for (let i = 0; i < count; i++) {
      const code = generateCode();
      newCodes.push(code);
      pipeline.set(`invite:code:${code}`, { status: "available" });
    }

    await pipeline.exec();

    return NextResponse.json({ codes: newCodes });
  } catch (err) {
    console.error("Invite codes generate error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
