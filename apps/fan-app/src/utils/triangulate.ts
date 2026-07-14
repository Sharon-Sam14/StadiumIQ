// ============================================================
// BLE TRILATERATION UTILITY
// Solves a 3-circle intersection problem to estimate 2D position
// given three reference beacon positions and measured distances.
// ============================================================

export interface Point2D {
  x: number;
  y: number;
}

/**
 * Triangulates a 2D position from three reference points and their
 * respective distances using the linearized least-squares method.
 *
 * @param x1 - X coordinate of beacon 1
 * @param y1 - Y coordinate of beacon 1
 * @param d1 - Estimated distance to beacon 1
 * @param x2 - X coordinate of beacon 2
 * @param y2 - Y coordinate of beacon 2
 * @param d2 - Estimated distance to beacon 2
 * @param x3 - X coordinate of beacon 3
 * @param y3 - Y coordinate of beacon 3
 * @param d3 - Estimated distance to beacon 3
 * @returns Estimated {x, y} position, clamped to [5, 95] range
 */
export function triangulate(
  x1: number, y1: number, d1: number,
  x2: number, y2: number, d2: number,
  x3: number, y3: number, d3: number
): Point2D {
  // Coefficients from linearized circle equations:
  // (x - x1)^2 + (y - y1)^2 = d1^2
  // (x - x3)^2 + (y - y3)^2 = d3^2
  // Subtracting eliminates quadratic terms → linear system
  const A = 2 * (x3 - x1);
  const B = 2 * (y3 - y1);
  const C = d1 * d1 - d3 * d3 - x1 * x1 + x3 * x3 - y1 * y1 + y3 * y3;

  const D = 2 * (x3 - x2);
  const E = 2 * (y3 - y2);
  const F = d2 * d2 - d3 * d3 - x2 * x2 + x3 * x3 - y2 * y2 + y3 * y3;

  const det = A * E - B * D;

  // Handle degenerate case (collinear beacons)
  if (Math.abs(det) < 0.001) {
    return {
      x: clamp((x1 + x2 + x3) / 3, 5, 95),
      y: clamp((y1 + y2 + y3) / 3, 5, 95),
    };
  }

  const calcX = (C * E - B * F) / det;
  const calcY = (A * F - C * D) / det;

  return {
    x: clamp(calcX, 5, 95),
    y: clamp(calcY, 5, 95),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Converts RSSI (dBm) to estimated distance using free-space path-loss model.
 * Formula: distance = 10 ^ ((-30 - RSSI) / 20)
 * Assumes path-loss exponent n=2, reference RSSI at 1m = -30 dBm
 */
export function rssiToDistance(rssiDbm: number): number {
  return Math.pow(10, (-30 - rssiDbm) / 20);
}

/**
 * Simulates RSSI with Gaussian-like noise from a true distance.
 * noise amplitude: ±1.5 dBm with sinusoidal drift
 */
export function simulateRSSI(trueDistance: number, noiseSeed: number): number {
  const rawRSSI = -20 * Math.log10(Math.max(trueDistance, 0.1)) - 30;
  const noise = Math.sin(Date.now() / 1500 + noiseSeed) * 1.5;
  return Math.round(rawRSSI + noise);
}

/**
 * Computes a point along a quadratic Bézier curve at parameter t ∈ [0, 1].
 * Used for the walk simulator path animation.
 */
export function bezierPoint(
  p0: Point2D,
  p1: Point2D,
  p2: Point2D,
  t: number
): Point2D {
  const oneMinusT = 1 - t;
  return {
    x: oneMinusT * oneMinusT * p0.x + 2 * oneMinusT * t * p1.x + t * t * p2.x,
    y: oneMinusT * oneMinusT * p0.y + 2 * oneMinusT * t * p1.y + t * t * p2.y,
  };
}
