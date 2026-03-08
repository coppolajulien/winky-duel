import { ImageResponse } from "next/og";
import { createPublicClient, http, formatUnits } from "viem";
import { megaethTestnet } from "viem/chains";
import { WINKY_DUEL_ADDRESS, WINKY_DUEL_ABI } from "@/lib/constants";

export const runtime = "edge";
export const alt = "Blinkit Duel";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const publicClient = createPublicClient({
  chain: megaethTestnet,
  transport: http(),
});

export default async function OGImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const duelId = BigInt(id);

  let score = 0;
  let stake = "0";
  let status = 0;

  try {
    const raw = (await publicClient.readContract({
      address: WINKY_DUEL_ADDRESS,
      abi: WINKY_DUEL_ABI,
      functionName: "getDuel",
      args: [duelId],
    })) as {
      creator: string;
      challenger: string;
      stake: bigint;
      creatorScore: number;
      challengerScore: number;
      status: number;
    };
    score = Number(raw.creatorScore);
    stake = parseFloat(formatUnits(raw.stake, 18)).toString();
    status = Number(raw.status);
  } catch {
    // Duel not found
  }

  const statusLabel =
    status === 0
      ? "OPEN — Waiting for challenger"
      : status === 1
        ? "SETTLED"
        : status === 2
          ? "CANCELLED"
          : "IN PROGRESS";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a0a12 30%, #0a0a1a 70%, #0a0a0a 100%)",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            right: "-100px",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(232,69,122,0.15) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-150px",
            left: "-100px",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(232,69,122,0.1) 0%, transparent 70%)",
          }}
        />

        {/* Top bar */}
        <div
          style={{
            position: "absolute",
            top: "40px",
            left: "50px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <span
            style={{
              fontSize: "24px",
              fontWeight: 800,
              color: "white",
              letterSpacing: "0.1em",
            }}
          >
            BLINKIT
          </span>
        </div>

        <div
          style={{
            position: "absolute",
            top: "42px",
            right: "50px",
            fontSize: "18px",
            color: "rgba(255,255,255,0.4)",
            fontWeight: 600,
          }}
        >
          Duel #{id}
        </div>

        {/* Score */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: "16px",
            marginBottom: "12px",
          }}
        >
          <span
            style={{
              fontSize: "160px",
              fontWeight: 900,
              color: "white",
              lineHeight: 1,
            }}
          >
            {score}
          </span>
          <span
            style={{
              fontSize: "40px",
              color: "rgba(255,255,255,0.4)",
              fontWeight: 600,
            }}
          >
            blinks
          </span>
        </div>

        {/* Stake */}
        <div
          style={{
            fontSize: "56px",
            fontWeight: 800,
            color: "#e8457a",
            marginBottom: "28px",
          }}
        >
          ${stake} USDM
        </div>

        {/* Status badge */}
        <div
          style={{
            fontSize: "20px",
            fontWeight: 700,
            color: status === 0 ? "#4ade80" : "rgba(255,255,255,0.5)",
            letterSpacing: "0.1em",
            padding: "10px 32px",
            borderRadius: "999px",
            background:
              status === 0
                ? "rgba(74,222,128,0.12)"
                : "rgba(255,255,255,0.06)",
            border: `1px solid ${status === 0 ? "rgba(74,222,128,0.25)" : "rgba(255,255,255,0.1)"}`,
          }}
        >
          {statusLabel}
        </div>

        {/* Bottom tagline */}
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            fontSize: "16px",
            color: "rgba(255,255,255,0.3)",
            fontWeight: 500,
          }}
        >
          Bet. Blink. Win the Pool.
        </div>
      </div>
    ),
    { ...size }
  );
}
