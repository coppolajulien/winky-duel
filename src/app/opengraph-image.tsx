import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Blinkit — The First PvP Blink-to-Earn Game";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
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
          background: "linear-gradient(135deg, #0a0a0b 0%, #19191A 50%, #1a1015 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Decorative pink glow */}
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
            bottom: "-80px",
            left: "-80px",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(232,69,122,0.1) 0%, transparent 70%)",
          }}
        />

        {/* Logo text */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              fontSize: "28px",
              fontWeight: 700,
              letterSpacing: "0.1em",
              color: "rgba(236,232,232,0.5)",
            }}
          >
            BLINKIT
          </div>
        </div>

        {/* Main title */}
        <div
          style={{
            fontSize: "72px",
            fontWeight: 800,
            color: "#ECE8E8",
            textAlign: "center",
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
          }}
        >
          Bet. Blink.
        </div>
        <div
          style={{
            fontSize: "72px",
            fontWeight: 800,
            color: "#ECE8E8",
            textAlign: "center",
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
          }}
        >
          Win the pool.
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: "22px",
            color: "rgba(236,232,232,0.5)",
            marginTop: "24px",
            textAlign: "center",
          }}
        >
          The first PvP blink-to-earn game on MegaETH
        </div>

        {/* Accent line */}
        <div
          style={{
            width: "80px",
            height: "4px",
            borderRadius: "2px",
            background: "#e8457a",
            marginTop: "32px",
          }}
        />

        {/* Dollar amounts decoration */}
        <div
          style={{
            display: "flex",
            gap: "20px",
            marginTop: "36px",
          }}
        >
          {["$5", "$25", "$50", "$100"].map((amt) => (
            <div
              key={amt}
              style={{
                padding: "8px 20px",
                borderRadius: "999px",
                border: "1px solid rgba(232,69,122,0.3)",
                color: "#e8457a",
                fontSize: "18px",
                fontWeight: 700,
                fontFamily: "ui-monospace, monospace",
              }}
            >
              {amt}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
