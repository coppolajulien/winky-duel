import { NextResponse } from "next/server";
import { createPublicClient, http, formatUnits } from "viem";
import { appChain } from "@/lib/chain";
import { WINKY_DUEL_ADDRESS, WINKY_DUEL_ABI } from "@/lib/constants";
import { isRateLimited, getClientIp } from "@/app/api/game/_lib";

const publicClient = createPublicClient({
  chain: appChain,
  transport: http(),
});

interface DuelData {
  creator: string;
  challenger: string;
  stake: bigint;
  creatorScore: number;
  challengerScore: number;
  status: number;
  joinedAt: number;
}

// Status enum: 0=Open, 1=Locked, 2=Settled, 3=Cancelled
const SETTLED = 2;

export async function GET(req: Request) {
  // Rate limit: 20 requests per minute per IP
  const ip = await getClientIp();
  if (await isRateLimited(ip, 20, 60, "stats")) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address")?.toLowerCase();

  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return NextResponse.json(
      { error: "Missing or invalid ?address=0x... parameter" },
      { status: 400 }
    );
  }

  try {
    // Get total duels
    const nextId = (await publicClient.readContract({
      address: WINKY_DUEL_ADDRESS,
      abi: WINKY_DUEL_ABI,
      functionName: "nextDuelId",
    })) as bigint;

    const total = Number(nextId);

    if (total === 0) {
      return NextResponse.json({
        address,
        totalDuels: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        totalBlinks: 0,
        totalEarned: "0",
        totalLost: "0",
        netProfit: "0",
        winRate: 0,
        avgScore: 0,
        bestScore: 0,
        duels: [],
      });
    }

    // Fetch all duels via multicall
    const calls = Array.from({ length: total }, (_, i) => ({
      address: WINKY_DUEL_ADDRESS as `0x${string}`,
      abi: WINKY_DUEL_ABI,
      functionName: "getDuel" as const,
      args: [BigInt(i)],
    }));

    const results = await publicClient.multicall({ contracts: calls });

    let wins = 0;
    let losses = 0;
    let draws = 0;
    let totalBlinks = 0;
    let totalEarned = 0;
    let totalLost = 0;
    let bestScore = 0;
    const scores: number[] = [];
    const playerDuels: {
      duelId: number;
      role: "creator" | "challenger";
      opponent: string;
      stake: string;
      playerScore: number;
      opponentScore: number;
      result: "win" | "loss" | "draw" | "pending" | "cancelled";
      earned: string;
    }[] = [];

    const RAKE_BPS = 250; // 2.5%

    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      if (r.status !== "success" || !r.result) continue;

      const d = r.result as unknown as DuelData;
      const creator = d.creator.toLowerCase();
      const challenger = d.challenger.toLowerCase();
      const stakeNum = parseFloat(formatUnits(d.stake, 18));

      const isCreator = creator === address;
      const isChallenger = challenger === address;

      if (!isCreator && !isChallenger) continue;

      const role = isCreator ? "creator" : "challenger";
      const playerScore = isCreator ? d.creatorScore : d.challengerScore;
      const opponentScore = isCreator ? d.challengerScore : d.creatorScore;
      const opponent = isCreator ? d.challenger : d.creator;

      totalBlinks += playerScore;
      scores.push(playerScore);
      if (playerScore > bestScore) bestScore = playerScore;

      let result: "win" | "loss" | "draw" | "pending" | "cancelled";
      let earned = 0;

      if (d.status === SETTLED) {
        if (playerScore > opponentScore) {
          result = "win";
          wins++;
          // Winner gets opponent's stake minus rake
          earned = stakeNum * (1 - RAKE_BPS / 10000);
          totalEarned += earned;
        } else if (playerScore < opponentScore) {
          result = "loss";
          losses++;
          totalLost += stakeNum;
        } else {
          result = "draw";
          draws++;
        }
      } else if (d.status === 3) {
        result = "cancelled";
      } else {
        result = "pending";
      }

      playerDuels.push({
        duelId: i,
        role,
        opponent,
        stake: stakeNum.toFixed(2),
        playerScore,
        opponentScore,
        result,
        earned: earned > 0 ? earned.toFixed(2) : "0",
      });
    }

    const totalGames = wins + losses + draws;
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;
    const netProfit = totalEarned - totalLost;

    return NextResponse.json(
      {
        address,
        totalDuels: playerDuels.length,
        wins,
        losses,
        draws,
        totalBlinks,
        totalEarned: totalEarned.toFixed(2),
        totalLost: totalLost.toFixed(2),
        netProfit: netProfit.toFixed(2),
        winRate,
        avgScore,
        bestScore,
        duels: playerDuels.reverse(), // most recent first
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET",
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      }
    );
  } catch (err) {
    console.error("Stats API error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
