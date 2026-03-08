import type { ChartPoint, GameResult } from "@/lib/types";

const W = 1200;
const H = 630;
const PINK = "#e8457a";
const TEXT = "#ECE8E8";
const TEXT_DIM = "rgba(236, 232, 232, 0.4)";

const DESKTOP_SLIDES = [
  "/desktop-bg.jpg",
  "/desktop-bg-1.jpg",
  "/desktop-bg-2.jpg",
  "/desktop-bg-3.jpg",
  "/desktop-bg-4.jpg",
  "/desktop-bg-5.jpg",
];

/** Load an image from a URL */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Generate a share card image as a Blob.
 * Draws: background image, logo, chart curve, scores, winnings.
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

  // ─── Background image ───
  const bgSrc = DESKTOP_SLIDES[Math.floor(Math.random() * DESKTOP_SLIDES.length)];
  try {
    const bgImg = await loadImage(bgSrc);
    // Cover the canvas
    const scale = Math.max(W / bgImg.width, H / bgImg.height);
    const sw = bgImg.width * scale;
    const sh = bgImg.height * scale;
    ctx.drawImage(bgImg, (W - sw) / 2, (H - sh) / 2, sw, sh);
  } catch {
    // Fallback solid color
    ctx.fillStyle = "#19191A";
    ctx.fillRect(0, 0, W, H);
  }

  // Dark overlay for readability
  const overlay = ctx.createLinearGradient(0, 0, 0, H);
  overlay.addColorStop(0, "rgba(25, 25, 26, 0.5)");
  overlay.addColorStop(0.5, "rgba(25, 25, 26, 0.65)");
  overlay.addColorStop(1, "rgba(25, 25, 26, 0.9)");
  ctx.fillStyle = overlay;
  ctx.fillRect(0, 0, W, H);

  // ─── Chart area ───
  const chartLeft = 80;
  const chartRight = W - 80;
  const chartTop = 120;
  const chartBottom = H - 160;
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
      ctx.strokeStyle = TEXT;
      ctx.globalAlpha = 0.2;
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
    grad.addColorStop(0, "rgba(232, 69, 122, 0.35)");
    grad.addColorStop(0.6, "rgba(232, 69, 122, 0.08)");
    grad.addColorStop(1, "rgba(232, 69, 122, 0)");

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
    ctx.strokeStyle = "rgba(25, 25, 26, 0.8)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // ─── Logo top-left (SVG loaded as image) ───
  const logoSize = 47; // 36 * 1.3
  try {
    const logoImg = await loadImage("/logo-blinkit.svg");
    // Draw white version: use a temporary canvas to recolor
    const tmpCanvas = document.createElement("canvas");
    tmpCanvas.width = logoSize;
    tmpCanvas.height = logoSize;
    const tmpCtx = tmpCanvas.getContext("2d")!;
    tmpCtx.drawImage(logoImg, 0, 0, logoSize, logoSize);
    // Recolor to white
    tmpCtx.globalCompositeOperation = "source-in";
    tmpCtx.fillStyle = TEXT;
    tmpCtx.fillRect(0, 0, logoSize, logoSize);
    ctx.drawImage(tmpCanvas, 50, 22);
  } catch {
    // fallback: no logo
  }

  // "BLINKIT" text next to logo (+30%)
  ctx.font = "900 31px system-ui, sans-serif";
  ctx.fillStyle = TEXT;
  ctx.textAlign = "left";
  ctx.fillText("BLINKIT", 105, 56);

  // ─── Result overlay (bottom section) ───
  const overlayBottom = ctx.createLinearGradient(0, H - 200, 0, H);
  overlayBottom.addColorStop(0, "rgba(25, 25, 26, 0)");
  overlayBottom.addColorStop(0.4, "rgba(25, 25, 26, 0.8)");
  overlayBottom.addColorStop(1, "rgba(25, 25, 26, 0.95)");
  ctx.fillStyle = overlayBottom;
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
    ctx.fillStyle = "rgba(236, 232, 232, 0.2)";
    ctx.textAlign = "center";
    ctx.fillText("VS", W / 2, scoreY - 10);

    ctx.font = "900 64px system-ui, sans-serif";
    ctx.fillStyle = TEXT;
    ctx.globalAlpha = 0.5;
    ctx.textAlign = "right";
    ctx.fillText(String(result.target), W - 80, scoreY);
    ctx.globalAlpha = 1;

    ctx.font = "500 13px system-ui, sans-serif";
    ctx.fillStyle = TEXT_DIM;
    ctx.fillText("TARGET", W - 80, scoreY + 22);
  }

  // ─── Result badge (centered, large) ───
  if (result.isChallenge) {
    if (result.won === true) {
      const earnings = `$${(stake * 2 * 0.95 - stake).toFixed(0)}`;
      ctx.font = "900 83px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = TEXT;
      ctx.fillText(earnings, W / 2, H / 2 - 10);

      ctx.font = "700 20px system-ui, sans-serif";
      ctx.fillStyle = TEXT;
      ctx.globalAlpha = 0.6;
      ctx.fillText("YOU WIN", W / 2, H / 2 + 24);
      ctx.globalAlpha = 1;
    } else if (result.won === false) {
      ctx.font = "900 48px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = TEXT;
      ctx.globalAlpha = 0.4;
      ctx.fillText("DEFEATED", W / 2, H / 2 + 10);
      ctx.globalAlpha = 1;
    } else {
      ctx.font = "900 48px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = TEXT;
      ctx.globalAlpha = 0.4;
      ctx.fillText("DRAW", W / 2, H / 2 + 10);
      ctx.globalAlpha = 1;
    }
  } else {
    ctx.font = "900 48px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = PINK;
    ctx.fillText(`${stake} USDM`, W / 2, H / 2 - 5);

    ctx.font = "700 20px system-ui, sans-serif";
    ctx.fillStyle = TEXT;
    ctx.globalAlpha = 0.5;
    ctx.fillText("DEPOSITED", W / 2, H / 2 + 24);
    ctx.globalAlpha = 1;
  }

  // ─── Legend ───
  ctx.textAlign = "left";
  ctx.font = "600 11px system-ui, sans-serif";
  ctx.fillStyle = PINK;
  ctx.fillText("━ You", chartLeft, chartTop - 12);
  if (result.target !== null) {
    ctx.fillStyle = TEXT;
    ctx.globalAlpha = 0.35;
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
  a.download = "blinkit-result.png";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return "downloaded";
}
