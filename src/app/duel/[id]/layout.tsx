import type { Metadata } from "next";
import { createPublicClient, http, formatUnits } from "viem";
import { megaethTestnet } from "viem/chains";
import { WINKY_DUEL_ADDRESS, WINKY_DUEL_ABI } from "@/lib/constants";

const publicClient = createPublicClient({
  chain: megaethTestnet,
  transport: http(),
});

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;

  let score = 0;
  let stake = "0";

  try {
    const raw = await publicClient.readContract({
      address: WINKY_DUEL_ADDRESS,
      abi: WINKY_DUEL_ABI,
      functionName: "getDuel",
      args: [BigInt(id)],
    }) as {
      stake: bigint;
      creatorScore: number;
    };
    score = Number(raw.creatorScore);
    stake = parseFloat(formatUnits(raw.stake, 18)).toString();
  } catch {
    // Duel not found
  }

  const title = `Duel #${id} — ${score} blinks | $${stake} USDM`;
  const description = `Can you beat ${score} blinks? $${stake} USDM on the line. Accept the challenge on Blinkit!`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default function DuelLayout({ children }: { children: React.ReactNode }) {
  return children;
}
