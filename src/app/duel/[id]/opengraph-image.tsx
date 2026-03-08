import { ImageResponse } from "next/og";
import { createPublicClient, http, formatUnits } from "viem";
import { megaethTestnet } from "viem/chains";
import { WINKY_DUEL_ADDRESS, WINKY_DUEL_ABI, APP_URL } from "@/lib/constants";

export const runtime = "edge";
export const alt = "Blinkit Duel";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BACKGROUNDS = [
  "desktop-bg.jpg",
  "desktop-bg-1.jpg",
  "desktop-bg-2.jpg",
  "desktop-bg-3.jpg",
  "desktop-bg-4.jpg",
  "desktop-bg-5.jpg",
];

const publicClient = createPublicClient({
  chain: megaethTestnet,
  transport: http(),
});

export default async function OGImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const duelId = BigInt(id);

  // Pick a deterministic-random background based on duel ID
  const bgFile = BACKGROUNDS[Number(duelId) % BACKGROUNDS.length];
  const bgUrl = `${APP_URL}/${bgFile}`;

  // Fetch duel data from contract
  let score = 0;
  let stake = "0";
  let status = 0;

  try {
    const raw = await publicClient.readContract({
      address: WINKY_DUEL_ADDRESS,
      abi: WINKY_DUEL_ABI,
      functionName: "getDuel",
      args: [duelId],
    }) as {
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
    // Duel not found — show default
  }

  const statusLabel =
    status === 0 ? "OPEN — Waiting for challenger"
    : status === 1 ? "SETTLED"
    : status === 2 ? "CANCELLED"
    : "IN PROGRESS";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
        }}
      >
        {/* Background */}
        <img
          src={bgUrl}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />

        {/* Dark overlay */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.8) 100%)",
          }}
        />

        {/* Content */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px",
          }}
        >
          {/* Logo + Name */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
            <span style={{ fontSize: "28px", fontWeight: 800, color: "white", letterSpacing: "0.08em" }}>
              BLINKIT
            </span>
          </div>

          {/* Duel # */}
          <div style={{ fontSize: "20px", color: "rgba(255,255,255,0.5)", marginBottom: "16px", fontWeight: 600 }}>
            Duel #{id}
          </div>

          {/* Score */}
          <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginBottom: "8px" }}>
            <span style={{ fontSize: "120px", fontWeight: 900, color: "white", lineHeight: 1 }}>
              {score}
            </span>
            <span style={{ fontSize: "32px", color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>
              blinks
            </span>
          </div>

          {/* Stake */}
          <div
            style={{
              fontSize: "48px",
              fontWeight: 800,
              color: "#e8457a",
              marginBottom: "20px",
            }}
          >
            ${stake} USDM
          </div>

          {/* Status */}
          <div
            style={{
              fontSize: "18px",
              fontWeight: 700,
              color: status === 0 ? "#4ade80" : "rgba(255,255,255,0.6)",
              textTransform: "uppercase" as const,
              letterSpacing: "0.12em",
              padding: "8px 24px",
              borderRadius: "999px",
              background: status === 0 ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.08)",
            }}
          >
            {statusLabel}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
