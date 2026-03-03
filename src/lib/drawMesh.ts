import {
  FACE_TRIS,
  FACE_OVAL,
  LEFT_EYE_CONTOUR,
  RIGHT_EYE_CONTOUR,
  LIPS,
} from "./faceMeshData";
import type { ThemeColors } from "./theme";

interface Landmark {
  x: number;
  y: number;
  z?: number;
}

/**
 * Draw a neon wireframe face mesh on a canvas context.
 * flash: 0-1 value for blink flash effect intensity
 */
export function drawMesh(
  ctx: CanvasRenderingContext2D,
  landmarks: Landmark[] | null,
  w: number,
  h: number,
  flash: number,
  colors: ThemeColors
): void {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = colors.canvasMeshBg;
  ctx.fillRect(0, 0, w, h);

  if (!landmarks || !landmarks.length) {
    ctx.fillStyle = colors.canvasMeshNoface;
    ctx.font = "11px Inter";
    ctx.textAlign = "center";
    ctx.fillText("No face", w / 2, h / 2);
    return;
  }

  const tx = (p: Landmark) => (1 - p.x) * w;
  const ty = (p: Landmark) => p.y * h;
  const g = flash > 0;
  const dark = colors.isDark;

  // Background grid
  ctx.strokeStyle = dark ? "rgba(255,60,180,0.015)" : "rgba(25,25,26,0.03)";
  ctx.lineWidth = 0.5;
  for (let x = 0; x < w; x += 20) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += 20) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // Face triangles
  ctx.lineWidth = 0.5;
  for (let i = 0; i < FACE_TRIS.length; i += 3) {
    const a = landmarks[FACE_TRIS[i]];
    const b = landmarks[FACE_TRIS[i + 1]];
    const c = landmarks[FACE_TRIS[i + 2]];
    if (!a || !b || !c) continue;

    const z = ((a.z || 0) + (b.z || 0) + (c.z || 0)) / 3;
    const dp = Math.max(0, Math.min(1, (z + 0.1) * 5));

    if (g) {
      ctx.strokeStyle = `hsla(10,85%,50%,${0.4 + dp * 0.4})`;
    } else if (dark) {
      ctx.strokeStyle = `hsla(${300 + dp * 40},85%,50%,${0.12 + dp * 0.2})`;
    } else {
      ctx.strokeStyle = `hsla(${340 + dp * 20},60%,55%,${0.15 + dp * 0.25})`;
    }

    ctx.beginPath();
    ctx.moveTo(tx(a), ty(a));
    ctx.lineTo(tx(b), ty(b));
    ctx.lineTo(tx(c), ty(c));
    ctx.closePath();
    ctx.stroke();
  }

  // Face oval outline
  ctx.lineWidth = g ? 2 : 1.2;
  if (g) {
    ctx.strokeStyle = "hsla(350,100%,65%,0.8)";
    ctx.shadowColor = "rgba(255,60,100,0.6)";
  } else if (dark) {
    ctx.strokeStyle = "hsla(320,90%,55%,0.5)";
    ctx.shadowColor = "rgba(255,60,180,0.2)";
  } else {
    ctx.strokeStyle = "hsla(345,70%,60%,0.6)";
    ctx.shadowColor = "rgba(255,138,168,0.3)";
  }
  ctx.shadowBlur = g ? 14 : 5;

  ctx.beginPath();
  FACE_OVAL.forEach((idx, i) => {
    const p = landmarks[idx];
    if (!p) return;
    if (i === 0) ctx.moveTo(tx(p), ty(p));
    else ctx.lineTo(tx(p), ty(p));
  });
  ctx.closePath();
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Eyes
  const drawEye = (ids: number[]) => {
    ctx.lineWidth = g ? 1.5 : 0.8;
    if (g) {
      ctx.strokeStyle = "hsla(30,100%,60%,0.8)";
    } else if (dark) {
      ctx.strokeStyle = "hsla(340,90%,60%,0.6)";
    } else {
      ctx.strokeStyle = "hsla(345,65%,55%,0.7)";
    }
    ctx.beginPath();
    ids.forEach((id, i) => {
      const p = landmarks[id];
      if (!p) return;
      if (i === 0) ctx.moveTo(tx(p), ty(p));
      else ctx.lineTo(tx(p), ty(p));
    });
    ctx.closePath();
    ctx.stroke();
  };
  drawEye(LEFT_EYE_CONTOUR);
  drawEye(RIGHT_EYE_CONTOUR);

  // Lips
  ctx.lineWidth = g ? 1.2 : 0.6;
  if (g) {
    ctx.strokeStyle = "hsla(0,100%,60%,0.7)";
  } else if (dark) {
    ctx.strokeStyle = "hsla(330,80%,50%,0.4)";
  } else {
    ctx.strokeStyle = "hsla(345,60%,55%,0.5)";
  }
  ctx.beginPath();
  LIPS.forEach((id, i) => {
    const p = landmarks[id];
    if (!p) return;
    if (i === 0) ctx.moveTo(tx(p), ty(p));
    else ctx.lineTo(tx(p), ty(p));
  });
  ctx.stroke();

  // Scattered dots
  if (g) {
    ctx.fillStyle = "hsla(20,100%,65%,0.7)";
  } else if (dark) {
    ctx.fillStyle = "hsla(320,80%,60%,0.35)";
  } else {
    ctx.fillStyle = "hsla(345,55%,55%,0.4)";
  }
  for (let i = 0; i < landmarks.length; i += 7) {
    const p = landmarks[i];
    if (!p) continue;
    ctx.beginPath();
    ctx.arc(tx(p), ty(p), g ? 1.5 : 0.8, 0, Math.PI * 2);
    ctx.fill();
  }

  // Flash glow effect
  if (g && landmarks[1]) {
    const n = landmarks[1];
    const gr = ctx.createRadialGradient(tx(n), ty(n), 0, tx(n), ty(n), 80);
    gr.addColorStop(0, dark ? "rgba(255,60,80,0.12)" : "rgba(255,138,168,0.15)");
    gr.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, w, h);
  }
}
