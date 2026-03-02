interface Landmark {
  x: number;
  y: number;
  z?: number;
}

/** Compute Eye Aspect Ratio from 6 landmark points */
export function computeEAR(indices: number[], landmarks: Landmark[]): number {
  const points = indices.map((i) => landmarks[i]);
  if (points.some((v) => !v)) return 1;

  const dist = (a: Landmark, b: Landmark) =>
    Math.sqrt(
      (a.x - b.x) ** 2 +
        (a.y - b.y) ** 2 +
        ((a.z || 0) - (b.z || 0)) ** 2
    );

  const horizontal = dist(points[0], points[3]);
  if (horizontal === 0) return 1;

  return (dist(points[1], points[5]) + dist(points[2], points[4])) / (2 * horizontal);
}
