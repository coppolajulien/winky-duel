import { NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { appChain } from "@/lib/chain";
import { WINKY_DUEL_ADDRESS, WINKY_DUEL_ABI } from "@/lib/constants";
import { redis, isRateLimited, getClientIp, verifyWalletSignature, isValidAddress } from "@/app/api/game/_lib";

// Include contract address in key so redeployments start fresh
const KEY = `private-duels:${WINKY_DUEL_ADDRESS.toLowerCase()}`;

const publicClient = createPublicClient({
  chain: appChain,
  transport: http(),
});

/** GET — return all private duel IDs */
export async function GET() {
  try {
    const ids: string[] = await redis.smembers(KEY);
    return NextResponse.json({ ids });
  } catch {
    return NextResponse.json({ ids: [] });
  }
}

/** POST { duelId, player, signature, timestamp } — mark a duel as private (creator only) */
export async function POST(req: Request) {
  try {
    const ip = await getClientIp();
    if (await isRateLimited(ip, 10, 60, "private-duels")) {
      return NextResponse.json({ error: "Rate limited" }, { status: 429 });
    }

    const { duelId, player, signature, timestamp } = (await req.json()) as {
      duelId: string;
      player: string;
      signature: string;
      timestamp: number;
    };

    if (!duelId || !/^\d+$/.test(duelId)) {
      return NextResponse.json({ error: "Invalid duelId" }, { status: 400 });
    }

    // Verify wallet signature
    if (!player || !isValidAddress(player) || !signature || !timestamp) {
      return NextResponse.json({ error: "Signature required" }, { status: 401 });
    }
    if (Math.abs(Date.now() - timestamp) > 60_000) {
      return NextResponse.json({ error: "Signature expired" }, { status: 401 });
    }
    const message = `Blinkit: private duel ${duelId}\n${timestamp}`;
    const valid = await verifyWalletSignature(player, message, signature);
    if (!valid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Verify duel exists on-chain, is Open, and caller is the creator
    try {
      const result = await publicClient.readContract({
        address: WINKY_DUEL_ADDRESS,
        abi: WINKY_DUEL_ABI,
        functionName: "getDuel",
        args: [BigInt(duelId)],
      });

      const duel = result as { creator: string; status: number };
      if (Number(duel.status) !== 0) {
        return NextResponse.json({ error: "Duel is not open" }, { status: 400 });
      }
      // Only the creator can mark their duel as private
      if (duel.creator.toLowerCase() !== player.toLowerCase()) {
        return NextResponse.json({ error: "Not the duel creator" }, { status: 403 });
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
