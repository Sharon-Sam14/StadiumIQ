import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../app";

// Mock database package
vi.mock("@stadiumiq/database", () => {
  const mockUser = {
    id: "3c986473-9bf7-4c07-9611-a84d0711db7c",
    auth0Id: "auth0|fan-priya-789",
    email: "priya.sharma@fan.worldcup.com",
    fullName: "Priya Sharma",
    role: "fan",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTicket = {
    id: "tkt-123",
    fanId: "3c986473-9bf7-4c07-9611-a84d0711db7c",
    matchId: "match-456",
    section: "112",
    row: "A",
    seat: "10",
    match: {
      id: "match-456",
      homeTeam: "France",
      awayTeam: "Senegal",
      kickOff: new Date(),
      venue: {
        id: "venue-789",
        name: "MetLife Stadium",
        location: "East Rutherford, NJ"
      }
    }
  };

  const mockIncident = {
    id: "inc-123",
    venueId: "venue-789",
    reportedBy: "3c986473-9bf7-4c07-9611-a84d0711db7c",
    type: "medical",
    severity: "low",
    description: "Liquid spill in section 112",
    locationZone: "Section 112",
    status: "open",
    aiActions: [],
  };

  return {
    prisma: {
      user: {
        findUnique: vi.fn().mockImplementation(({ where }) => {
          if (where.auth0Id === "auth0|fan-priya-789") {
            return Promise.resolve(mockUser);
          }
          return Promise.resolve(null);
        }),
      },
      ticket: {
        findMany: vi.fn().mockResolvedValue([mockTicket]),
      },
      incident: {
        create: vi.fn().mockResolvedValue(mockIncident),
      },
    },
    IncidentType: {
      medical: "medical",
      crowd: "crowd",
      security: "security",
      infrastructure: "infrastructure",
      lost_item: "lost_item",
      other: "other",
    },
    Severity: {
      low: "low",
      medium: "medium",
      high: "high",
      critical: "critical",
    },
    IncidentStatus: {
      open: "open",
      in_progress: "in_progress",
      resolved: "resolved",
    },
  };
});

// Mock Redis Client
vi.mock("redis", () => {
  return {
    createClient: vi.fn().mockReturnValue({
      connect: vi.fn().mockResolvedValue(null),
      get: vi.fn().mockResolvedValue(null),
      setEx: vi.fn().mockResolvedValue(null),
    }),
  };
});

describe("Fan Service REST API Endpoints", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /health", () => {
    it("should return service health status", async () => {
      const res = await request(app).get("/health");
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        status: "healthy",
        service: "fan-service",
      });
    });
  });

  describe("GET /api/v1/fans/me", () => {
    it("should fetch profile of the logged-in fan", async () => {
      const res = await request(app)
        .get("/api/v1/fans/me")
        .set("x-user-id", "auth0|fan-priya-789");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.fullName).toBe("Priya Sharma");
    });

    it("should return 404 error if fan is not found", async () => {
      const res = await request(app)
        .get("/api/v1/fans/me")
        .set("x-user-id", "non-existent-user");

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("USER_NOT_FOUND");
    });
  });

  describe("GET /api/v1/fans/tickets", () => {
    it("should fetch tickets of the logged-in fan", async () => {
      const res = await request(app)
        .get("/api/v1/fans/tickets")
        .set("x-user-id", "auth0|fan-priya-789");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].id).toBe("tkt-123");
    });
  });

  describe("POST /api/v1/fans/incidents", () => {
    it("should create incident successfully if data is valid", async () => {
      const payload = {
        venueId: "e9b5f922-bfb2-4d2c-8067-9c985c5dfb56",
        type: "medical",
        severity: "low",
        description: "Liquid spill in section 112",
        locationZone: "Section 112",
      };

      const res = await request(app)
        .post("/api/v1/fans/incidents")
        .set("x-user-id", "auth0|fan-priya-789")
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe("inc-123");
    });

    it("should fail validation if fields are missing", async () => {
      const payload = {
        venueId: "not-a-uuid",
        type: "medical",
      };

      const res = await request(app)
        .post("/api/v1/fans/incidents")
        .set("x-user-id", "auth0|fan-priya-789")
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_FAILED");
    });
  });
});
