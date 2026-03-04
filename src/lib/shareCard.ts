import type { ChartPoint, GameResult } from "@/lib/types";

const W = 1200;
const H = 630;
const PINK = "#ff2d78";
const CYAN = "#00e5ff";
const ORANGE = "#ff9500";
const BG = "#0d0d12";
const GRID = "rgba(255,255,255,0.04)";
const TEXT_DIM = "rgba(255,255,255,0.4)";

/**
 * Generate a share card image as a Blob.
 * Draws: dark background, grid, chart curve, logo, scores, winnings.
 */
export async function generateShareCard(
  chartData: ChartPoint[],
  result: GameResult,
  stake: number
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // ─── Background ───
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  // Subtle gradient overlay
  const bgGrad = ctx.createLinearGradient(0, 0, W, H);
  bgGrad.addColorStop(0, "rgba(255, 45, 120, 0.06)");
  bgGrad.addColorStop(1, "rgba(0, 229, 255, 0.03)");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // ─── Grid lines ───
  ctx.strokeStyle = GRID;
  ctx.lineWidth = 1;
  for (let y = 80; y < H - 60; y += 45) {
    ctx.beginPath();
    ctx.moveTo(60, y);
    ctx.lineTo(W - 60, y);
    ctx.stroke();
  }

  // ─── Chart area ───
  const chartLeft = 80;
  const chartRight = W - 80;
  const chartTop = 120;
  const chartBottom = H - 140;
  const chartWidth = chartRight - chartLeft;
  const chartHeight = chartBottom - chartTop;

  if (chartData.length > 1) {
    const maxScore = Math.max(
      ...chartData.map((p) => Math.max(p.you, p.target ?? 0)),
      1
    );
    const maxTime = Math.max(...chartData.map((p) => p.t), 1);

    const toX = (t: number) => chartLeft + (t / maxTime) * chartWidth;
    const toY = (score: number) =>
      chartBottom - (score / (maxScore * 1.15)) * chartHeight;

    // ─── Target line (dashed, behind) ───
    if (chartData.some((p) => p.target !== undefined)) {
      ctx.strokeStyle = ORANGE;
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 6]);
      ctx.beginPath();
      chartData.forEach((p, i) => {
        const x = toX(p.t);
        const y = toY(p.target ?? 0);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }

    // ─── Player curve (gradient fill) ───
    const grad = ctx.createLinearGradient(0, chartTop, 0, chartBottom);
    grad.addColorStop(0, "rgba(255, 45, 120, 0.3)");
    grad.addColorStop(0.6, "rgba(255, 45, 120, 0.06)");
    grad.addColorStop(1, "rgba(255, 45, 120, 0)");

    // Fill
    ctx.beginPath();
    ctx.moveTo(toX(chartData[0].t), chartBottom);
    chartData.forEach((p) => {
      ctx.lineTo(toX(p.t), toY(p.you));
    });
    ctx.lineTo(toX(chartData[chartData.length - 1].t), chartBottom);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Stroke
    ctx.strokeStyle = PINK;
    ctx.lineWidth = 3;
    ctx.beginPath();
    chartData.forEach((p, i) => {
      const x = toX(p.t);
      const y = toY(p.you);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // End dot
    const lastPt = chartData[chartData.length - 1];
    ctx.beginPath();
    ctx.arc(toX(lastPt.t), toY(lastPt.you), 5, 0, Math.PI * 2);
    ctx.fillStyle = PINK;
    ctx.fill();
    ctx.strokeStyle = BG;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // ─── Logo top-left ───
  ctx.font = "bold 28px system-ui, sans-serif";
  ctx.fillStyle = "white";
  ctx.fillText("👁️", 50, 56);
  ctx.font = "900 italic 24px system-ui, sans-serif";
  ctx.fillStyle = PINK;
  ctx.fillText("winky", 88, 56);

  // "DUEL" text
  ctx.font = "600 14px system-ui, sans-serif";
  ctx.fillStyle = TEXT_DIM;
  ctx.fillText("DUEL", 175, 56);

  // ─── Result overlay (bottom section) ───
  // Dark overlay at bottom for text readability
  const overlayGrad = ctx.createLinearGradient(0, H - 200, 0, H);
  overlayGrad.addColorStop(0, "rgba(13, 13, 18, 0)");
  overlayGrad.addColorStop(0.4, "rgba(13, 13, 18, 0.85)");
  overlayGrad.addColorStop(1, "rgba(13, 13, 18, 0.95)");
  ctx.fillStyle = overlayGrad;
  ctx.fillRect(0, H - 200, W, 200);

  // ─── Scores ───
  const scoreY = H - 85;

  // My score
  ctx.font = "900 64px system-ui, sans-serif";
  ctx.fillStyle = PINK;
  ctx.textAlign = "left";
  ctx.fillText(String(result.my), 80, scoreY);

  ctx.font = "500 13px system-ui, sans-serif";
  ctx.fillStyle = TEXT_DIM;
  ctx.fillText("BLINKS", 80, scoreY + 22);

  // VS and target score (if challenge)
  if (result.target !== null) {
    ctx.font = "700 24px system-ui, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.textAlign = "center";
    ctx.fillText("VS", W / 2, scoreY - 10);

    ctx.font = "900 64px system-ui, sans-serif";
    ctx.fillStyle = ORANGE;
    ctx.textAlign = "right";
    ctx.fillText(String(result.target), W - 80, scoreY);

    ctx.font = "500 13px system-ui, sans-serif";
    ctx.fillStyle = TEXT_DIM;
    ctx.fillText("TARGET", W - 80, scoreY + 22);
  }

  // ─── Result badge (top-right) ───
  const badgeX = W - 60;
  const badgeY = 44;

  if (result.isChallenge) {
    if (result.won) {
      // WIN badge
      ctx.font = "900 18px system-ui, sans-serif";
      ctx.textAlign = "right";
      ctx.fillStyle = CYAN;
      ctx.fillText("🏆 YOU WIN!", badgeX, badgeY);

      // Winnings
      const earnings = (stake * 2 * 0.95 - stake).toFixed(2);
      ctx.font = "bold 16px system-ui, sans-serif";
      ctx.fillStyle = CYAN;
      ctx.fillText(`+$${earnings} USDM`, badgeX, badgeY + 26);
    } else {
      ctx.font = "900 18px system-ui, sans-serif";
      ctx.textAlign = "right";
      ctx.fillStyle = "#ff4444";
      ctx.fillText("💀 DEFEATED", badgeX, badgeY);
    }
  } else {
    ctx.font = "900 18px system-ui, sans-serif";
    ctx.textAlign = "right";
    ctx.fillStyle = PINK;
    ctx.fillText("⚔️ OPEN DUEL", badgeX, badgeY);

    ctx.font = "bold 16px system-ui, sans-serif";
    ctx.fillStyle = TEXT_DIM;
    ctx.fillText(`$${stake} USDM staked`, badgeX, badgeY + 26);
  }

  // ─── URL bottom-right ───
  ctx.font = "500 12px system-ui, sans-serif";
  ctx.fillStyle = TEXT_DIM;
  ctx.textAlign = "right";
  ctx.fillText("winky-duel.vercel.app", W - 50, H - 20);

  // ─── Legend ───
  ctx.textAlign = "left";
  ctx.font = "600 11px system-ui, sans-serif";
  ctx.fillStyle = PINK;
  ctx.fillText("━ You", chartLeft, chartTop - 12);
  if (result.target !== null) {
    ctx.fillStyle = ORANGE;
    ctx.globalAlpha = 0.5;
    ctx.fillText("┅ Target", chartLeft + 60, chartTop - 12);
    ctx.globalAlpha = 1;
  }

  // ─── Export as Blob ───
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to generate image"));
      },
      "image/png"
    );
  });
}

/**
 * Copy the share card image to the clipboard.
 * Falls back to download if clipboard API is not available.
 */
export async function copyShareCard(
  chartData: ChartPoint[],
  result: GameResult,
  stake: number
): Promise<"copied" | "downloaded"> {
  const blob = await generateShareCard(chartData, result, stake);

  // Try clipboard API first
  if (navigator.clipboard && typeof ClipboardItem !== "undefined") {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      return "copied";
    } catch {
      // Fallback to download
    }
  }

  // Fallback: download the image
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "winky-duel-result.png";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return "downloaded";
}
