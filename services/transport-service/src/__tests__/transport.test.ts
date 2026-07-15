import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import app from "../app";

describe("Transport Service API Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET /health returns healthy status", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("healthy");
    expect(res.body.service).toBe("transport-service");
  });

  it("GET /api/v1/transport returns schedules and details", async () => {
    const res = await request(app).get("/api/v1/transport");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.busSchedules).toHaveLength(2);
    expect(res.body.data.parkingZones[0].occupancyRate).toBe("99%");
    expect(res.body.data.rideshareETAMinutes.uber).toBe(7);
  });
});
