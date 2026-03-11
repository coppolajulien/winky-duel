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
    ctx.fillStyle = colors.textDim;
    ctx.font = "11px Inter";
    ctx.textAlign = "center";
    ctx.fillText("No face", w / 2, h / 2);
    return;
  }

  const tx = (p: Landmark) => (1 - p.x) * w;
  const ty = (p: Landmark) => p.y * h;
  const g = flash > 0;
  const dark = colors.isDark;

  // Face triangles — draw every other triangle to save perf
  ctx.lineWidth = 0.5;
  const triColor = g
    ? "hsla(345,70%,55%,0.4)"
    : dark
      ? "rgba(236,232,232,0.08)"
      : "hsla(345,60%,55%,0.15)";
  ctx.strokeStyle = triColor;
  ctx.beginPath();
  for (let i = 0; i < FACE_TRIS.length; i += 6) {
    const a = landmarks[FACE_TRIS[i]];
    const b = landmarks[FACE_TRIS[i + 1]];
    const c = landmarks[FACE_TRIS[i + 2]];
    if (!a || !b || !c) continue;
    ctx.moveTo(tx(a), ty(a));
    ctx.lineTo(tx(b), ty(b));
    ctx.lineTo(tx(c), ty(c));
    ctx.closePath();
  }
  ctx.stroke();

  // Face oval outline
  ctx.lineWidth = g ? 2 : 1.2;
  if (g) {
    ctx.strokeStyle = "hsla(345,70%,55%,0.7)";
  } else if (dark) {
    ctx.strokeStyle = "rgba(236,232,232,0.2)";
  } else {
    ctx.strokeStyle = "hsla(345,60%,55%,0.5)";
  }

  ctx.beginPath();
  FACE_OVAL.forEach((idx, i) => {
    const p = landmarks[idx];
    if (!p) return;
    if (i === 0) ctx.moveTo(tx(p), ty(p));
    else ctx.lineTo(tx(p), ty(p));
  });
  ctx.closePath();
  ctx.stroke();

  // Eyes
  const drawEye = (ids: number[]) => {
    ctx.lineWidth = g ? 1.5 : 0.8;
    if (g) {
      ctx.strokeStyle = "hsla(345,70%,55%,0.7)";
    } else if (dark) {
      ctx.strokeStyle = "rgba(236,232,232,0.25)";
    } else {
      ctx.strokeStyle = "hsla(345,55%,50%,0.6)";
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
    ctx.strokeStyle = "hsla(345,65%,50%,0.6)";
  } else if (dark) {
    ctx.strokeStyle = "rgba(236,232,232,0.15)";
  } else {
    ctx.strokeStyle = "hsla(345,55%,50%,0.4)";
  }
  ctx.beginPath();
  LIPS.forEach((id, i) => {
    const p = landmarks[id];
    if (!p) return;
    if (i === 0) ctx.moveTo(tx(p), ty(p));
    else ctx.lineTo(tx(p), ty(p));
  });
  ctx.stroke();

  // Scattered dots (sparse)
  ctx.fillStyle = g
    ? "hsla(345,65%,50%,0.6)"
    : dark
      ? "rgba(236,232,232,0.15)"
      : "hsla(345,50%,50%,0.3)";
  const dotR = g ? 1.5 : 0.8;
  for (let i = 0; i < landmarks.length; i += 15) {
    const p = landmarks[i];
    if (!p) continue;
    ctx.beginPath();
    ctx.arc(tx(p), ty(p), dotR, 0, Math.PI * 2);
    ctx.fill();
  }
}
