import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../app";

// Mock Database
vi.mock("@stadiumiq/database", () => {
  const mockUser = {
    id: "user-jake-id",
    auth0Id: "auth0|volunteer-jake-456",
    email: "jake@stadiumiq.com",
    fullName: "Jake Whitmore",
    role: "volunteer",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTask = {
    id: "task-1",
    title: "Redirect Section 200 flow to Gate B",
    priority: "high",
    status: "in_progress",
    volunteerId: "user-jake-id",
    completedAt: null,
  };

  const mockIncident = {
    id: "inc-99",
    venueId: "e9b5f922-bfb2-4d2c-8067-9c985c5dfb56",
    reportedBy: "user-jake-id",
    type: "crowd",
    severity: "medium",
    description: "High queue wait time at West gate",
    locationZone: "West gate",
    status: "open",
    aiActions: [],
  };

  const mockReward = {
    id: "reward-1",
    title: "Free Organic Concession Hotdog",
    description: "Redeem for 1 organic hotdog at MetLife Section 112 Concessions.",
    pointCost: 80,
    stock: 150,
    code: "REW-HDOG-982"
  };

  const mockChallenge = {
    id: "challenge-1",
    title: "Public Transit Commuter",
    description: "Use the subway or shuttle bus.",
    pointsValue: 30,
    xpValue: 60,
    type: "DAILY",
    targetCount: 1
  };

  const mockLeaderboard = {
    id: "lb-1",
    userId: "user-jake-id",
    userName: "Jake Whitmore",
    xpPoints: 240,
    ecoPoints: 120
  };

  const mockMetric = {
    id: "met-1",
    metricType: "waste_saved",
    value: 1424.8
  };

  return {
    prisma: {
      user: {
        findUnique: vi.fn().mockImplementation(({ where }) => {
          if (where.auth0Id === "auth0|volunteer-jake-456") {
            return Promise.resolve(mockUser);
          }
          return Promise.resolve(null);
        }),
        findFirst: vi.fn().mockResolvedValue(mockUser),
        create: vi.fn().mockResolvedValue(mockUser)
      },
      volunteerTask: {
        findMany: vi.fn().mockResolvedValue([mockTask]),
        findUnique: vi.fn().mockResolvedValue(mockTask),
        update: vi.fn().mockImplementation(({ data }) => Promise.resolve({ ...mockTask, ...data })),
      },
      incident: {
        create: vi.fn().mockResolvedValue(mockIncident),
        groupBy: vi.fn().mockImplementation(({ by }) => {
          if (by.includes("status")) {
            return Promise.resolve([{ status: "open", _count: { id: 2 } }]);
          }
          if (by.includes("severity")) {
            return Promise.resolve([{ severity: "medium", _count: { id: 2 } }]);
          }
          return Promise.resolve([{ type: "crowd", _count: { id: 2 } }]);
        })
      },
      ecoPointTransaction: {
        findMany: vi.fn().mockResolvedValue([]),
        create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: "tx-123", ...data }))
      },
      leaderboard: {
        findUnique: vi.fn().mockResolvedValue(mockLeaderboard),
        upsert: vi.fn().mockResolvedValue(mockLeaderboard),
        update: vi.fn().mockResolvedValue(mockLeaderboard),
        findMany: vi.fn().mockResolvedValue([mockLeaderboard])
      },
      achievement: {
        count: vi.fn().mockResolvedValue(3),
        findFirst: vi.fn().mockResolvedValue({ id: "ach-1", title: "Green Champion" })
      },
      userBadge: {
        findMany: vi.fn().mockResolvedValue([]),
        upsert: vi.fn().mockResolvedValue({ id: "badge-1" })
      },
      reward: {
        findMany: vi.fn().mockResolvedValue([mockReward]),
        findUnique: vi.fn().mockResolvedValue(mockReward),
        update: vi.fn().mockResolvedValue(mockReward)
      },
      challenge: {
        findMany: vi.fn().mockResolvedValue([mockChallenge])
      },
      sustainabilityMetric: {
        findMany: vi.fn().mockResolvedValue([mockMetric]),
        updateMany: vi.fn().mockResolvedValue({ count: 1 })
      },
      recyclingLog: {
        create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: "rec-123", ...data }))
      }
    },
    TaskStatus: {
      pending: "pending",
      in_progress: "in_progress",
      completed: "completed",
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
    Role: {
      fan: "fan",
      volunteer: "volunteer",
      organizer: "organizer"
    }
  };
});

// Mock Redis
vi.mock("redis", () => {
  return {
    createClient: vi.fn().mockReturnValue({
      connect: vi.fn().mockResolvedValue(null),
      get: vi.fn().mockResolvedValue(null),
      setEx: vi.fn().mockResolvedValue(null),
    }),
  };
});

// Mock Kafka
vi.mock("kafkajs", () => {
  return {
    Kafka: class {
      producer() {
        return {
          connect: vi.fn().mockResolvedValue(null),
          send: vi.fn().mockResolvedValue(null),
        };
      }
    }
  };
});

describe("Volunteer Service API Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET /health returns healthy", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("healthy");
  });

  it("GET /api/tasks returns tasks for volunteer", async () => {
    const res = await request(app)
      .get("/api/tasks")
      .set("x-user-id", "auth0|volunteer-jake-456");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].id).toBe("task-1");
  });

  it("PATCH /api/tasks/:id updates status", async () => {
    const res = await request(app)
      .patch("/api/tasks/task-1")
      .send({ status: "completed" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("completed");
  });

  it("GET /api/briefing returns shift briefing", async () => {
    const res = await request(app)
      .get("/api/briefing")
      .set("x-user-id", "auth0|volunteer-jake-456");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.role).toBe("Fan Services");
  });

  it("POST /api/incidents logs new volunteer incident", async () => {
    const payload = {
      venueId: "e9b5f922-bfb2-4d2c-8067-9c985c5dfb56",
      type: "crowd",
      severity: "medium",
      description: "High queue wait time at West gate",
      locationZone: "West gate",
    };

    const res = await request(app)
      .post("/api/incidents")
      .set("x-user-id", "auth0|volunteer-jake-456")
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe("inc-99");
  });

  it("POST /api/broadcast triggers safety alert broadcast", async () => {
    const payload = {
      title: "Weather Evacuation Warning",
      message: "Lightning alert active. Escort all spectators inside building lobbies.",
      severity: "high",
    };

    const res = await request(app)
      .post("/api/broadcast")
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.broadcasted).toBe(true);
  });

  it("GET /api/analytics returns status and category summaries", async () => {
    const res = await request(app).get("/api/analytics");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalActive).toBe(2);
  });

  // Sustainability Endpoint Tests
  it("GET /api/sustainability/points/balance fetches balance", async () => {
    const res = await request(app).get("/api/sustainability/points/balance");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.fanXP).toBe(240);
  });

  it("POST /api/sustainability/points/transaction creates eco points entry", async () => {
    const res = await request(app)
      .post("/api/sustainability/points/transaction")
      .send({ points: 20, type: "EARN", description: "Transit reward" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.transaction.points).toBe(20);
  });

  it("GET /api/sustainability/rewards lists catalog", async () => {
    const res = await request(app).get("/api/sustainability/rewards");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
  });

  it("GET /api/sustainability/challenges lists challenges", async () => {
    const res = await request(app).get("/api/sustainability/challenges");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data[0].pointsValue).toBe(30);
  });

  it("GET /api/sustainability/leaderboard standings", async () => {
    const res = await request(app).get("/api/sustainability/leaderboard");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data[0].userName).toBe("Jake Whitmore");
  });

  it("GET /api/sustainability/metrics fetches aggregates", async () => {
    const res = await request(app).get("/api/sustainability/metrics");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.wasteSavedKg).toBe(1424.8);
  });

  it("POST /api/sustainability/qr/validate processes check-ins", async () => {
    const res = await request(app)
      .post("/api/sustainability/qr/validate")
      .send({ qrCode: "QR-TRANSIT-101", locationType: "transit" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.pointsEarned).toBe(30);
  });

  it("POST /api/sustainability/recycling/log submits log details", async () => {
    const res = await request(app)
      .post("/api/sustainability/recycling/log")
      .send({ weightKg: 1.5, wasteType: "plastic" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.pointsEarned).toBe(75);
  });
});
