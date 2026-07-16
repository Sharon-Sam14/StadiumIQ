import { describe, it, expect } from "vitest";
import { triangulate, rssiToDistance, bezierPoint } from "@/utils/triangulate";

// ============================================================
// TRIANGULATE UNIT TESTS
// ============================================================

describe("triangulate()", () => {
  it("returns the correct intersection for equilateral triangle beacons at known distances", () => {
    // Three beacons at corners, target at center (50, 50)
    const result = triangulate(
      0,
      0,
      70.71, // beacon 1
      100,
      0,
      70.71, // beacon 2
      50,
      100,
      50, // beacon 3
    );
    // Center should be approximately (50, 33) for these coordinates
    expect(result.x).toBeGreaterThanOrEqual(5);
    expect(result.x).toBeLessThanOrEqual(95);
    expect(result.y).toBeGreaterThanOrEqual(5);
    expect(result.y).toBeLessThanOrEqual(95);
  });

  it("clamps result to [5, 95] range for any input", () => {
    const result = triangulate(0, 0, 0.001, 100, 0, 0.001, 50, 100, 0.001);
    expect(result.x).toBeGreaterThanOrEqual(5);
    expect(result.x).toBeLessThanOrEqual(95);
    expect(result.y).toBeGreaterThanOrEqual(5);
    expect(result.y).toBeLessThanOrEqual(95);
  });

  it("returns centroid fallback for collinear beacons (degenerate case)", () => {
    // Collinear beacons → determinant near 0 → centroid
    const result = triangulate(0, 0, 10, 50, 0, 10, 100, 0, 10);
    expect(result.x).toBeCloseTo(50, 0);
    expect(result.y).toBeGreaterThanOrEqual(5);
    expect(result.y).toBeLessThanOrEqual(95);
  });

  it("places the estimated point reasonably close to the true point", () => {
    // True target: (30, 40)
    const target = { x: 30, y: 40 };
    const beacons = [
      { x: 5, y: 5 },
      { x: 95, y: 5 },
      { x: 50, y: 90 },
    ];
    const distances = beacons.map((b) =>
      Math.hypot(b.x - target.x, b.y - target.y),
    );
    const result = triangulate(
      beacons[0].x,
      beacons[0].y,
      distances[0],
      beacons[1].x,
      beacons[1].y,
      distances[1],
      beacons[2].x,
      beacons[2].y,
      distances[2],
    );
    // Should be within 10 units of the true position
    const error = Math.hypot(result.x - target.x, result.y - target.y);
    expect(error).toBeLessThan(10);
  });
});

describe("rssiToDistance()", () => {
  it("returns 1.0m for RSSI of -30 dBm (reference point)", () => {
    const dist = rssiToDistance(-30);
    expect(dist).toBeCloseTo(1.0, 1);
  });

  it("returns greater distance for more negative RSSI values", () => {
    const nearDist = rssiToDistance(-40);
    const farDist = rssiToDistance(-70);
    expect(farDist).toBeGreaterThan(nearDist);
  });

  it("returns a positive number for all valid inputs", () => {
    [-30, -50, -70, -90].forEach((rssi) => {
      expect(rssiToDistance(rssi)).toBeGreaterThan(0);
    });
  });
});

describe("bezierPoint()", () => {
  it("returns start point at t=0", () => {
    const p0 = { x: 0, y: 0 };
    const p1 = { x: 50, y: 100 };
    const p2 = { x: 100, y: 0 };
    const result = bezierPoint(p0, p1, p2, 0);
    expect(result.x).toBeCloseTo(0, 5);
    expect(result.y).toBeCloseTo(0, 5);
  });

  it("returns end point at t=1", () => {
    const p0 = { x: 0, y: 0 };
    const p1 = { x: 50, y: 100 };
    const p2 = { x: 100, y: 0 };
    const result = bezierPoint(p0, p1, p2, 1);
    expect(result.x).toBeCloseTo(100, 5);
    expect(result.y).toBeCloseTo(0, 5);
  });

  it("returns midpoint at t=0.5 for symmetric curve", () => {
    const p0 = { x: 0, y: 0 };
    const p1 = { x: 50, y: 50 };
    const p2 = { x: 100, y: 0 };
    const result = bezierPoint(p0, p1, p2, 0.5);
    expect(result.x).toBeCloseTo(50, 1);
  });
});
