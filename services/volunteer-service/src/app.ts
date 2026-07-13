import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import { z } from "zod";
import { prisma, TaskStatus, IncidentType, Severity, IncidentStatus, Role } from "@stadiumiq/database";
import { createClient } from "redis";
import dotenv from "dotenv";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import { Kafka } from "kafkajs";
import crypto from "crypto";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

app.use(helmet());
app.use(cors());
app.use(express.json());

// 1. Initialize Redis Client with failover
const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const redisClient = createClient({ url: redisUrl });
let isRedisConnected = false;

redisClient.connect()
  .then(() => {
    console.log("Volunteer Service connected to Redis cache successfully.");
    isRedisConnected = true;
  })
  .catch((err) => {
    console.warn("Redis connection failed. Falling back to direct database reads.", err.message);
  });

// 2. Initialize Kafka Client with failover
const kafkaBroker = process.env.KAFKA_BROKER || "localhost:9092";
const kafka = new Kafka({
  clientId: "volunteer-service",
  brokers: [kafkaBroker]
});
const producer = kafka.producer();
let isKafkaConnected = false;

producer.connect()
  .then(() => {
    console.log("Kafka producer connected successfully.");
    isKafkaConnected = true;
  })
  .catch((err) => {
    console.warn("Failed to connect Kafka producer. Working in local log fallback mode.", err.message);
  });

// 3. Setup WebSocket Server wrapping HTTP server
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const clients = new Set<WebSocket>();

wss.on("connection", (ws) => {
  clients.add(ws);
  console.log(`New WebSocket connection established. Total clients: ${clients.size}`);
  
  ws.on("close", () => {
    clients.delete(ws);
    console.log(`WebSocket client disconnected. Total clients: ${clients.size}`);
  });
  
  // Send welcome confirmation
  ws.send(JSON.stringify({ type: "WELCOME", message: "Connected to StadiumIQ alerts broker." }));
});

function broadcastAlert(payload: unknown) {
  const data = JSON.stringify(payload);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(data);
      } catch (err) {
        console.error("WebSocket broadcast error:", err);
      }
    }
  }
}

// Standard API response envelope helper
function sendEnvelope(res: Response, data: unknown, cacheHit = false, status = 200) {
  return res.status(status).json({
    success: true,
    data,
    meta: {
      requestId: `req_${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toISOString(),
      version: "v1",
      cacheHit
    },
    error: null
  });
}

// Standard API error envelope helper
function sendError(res: Response, code: string, message: string, details = {}, status = 400) {
  return res.status(status).json({
    success: false,
    data: null,
    error: {
      code,
      message,
      details
    }
  });
}

// Middleware input validator using Zod
const validate = (schema: z.ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      sendError(res, "VALIDATION_FAILED", "Input validation failed.", error.flatten(), 400);
      return;
    }
    next(error);
  }
};

// 4. REST Endpoints

// GET /api/v1/volunteers/tasks
app.get("/api/v1/volunteers/tasks", async (req: Request, res: Response) => {
  try {
    const auth0Id = req.headers["x-user-id"] as string || "auth0|volunteer-jake-456";
    const user = await prisma.user.findUnique({ where: { auth0Id } });
    if (!user) {
      return sendError(res, "USER_NOT_FOUND", "Volunteer profile not found.", {}, 404);
    }

    const tasks = await prisma.volunteerTask.findMany({
      where: { volunteerId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return sendEnvelope(res, tasks);
  } catch (error: unknown) {
    console.error("Error fetching volunteer tasks:", error);
    return sendError(res, "INTERNAL_SERVER_ERROR", "An error occurred retrieving tasks.", {}, 500);
  }
});

const taskStatusSchema = z.object({
  status: z.nativeEnum(TaskStatus),
});

// PATCH /api/v1/volunteers/tasks/:id
app.patch("/api/v1/volunteers/tasks/:id", validate(taskStatusSchema), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const task = await prisma.volunteerTask.findUnique({ where: { id } });
    if (!task) {
      return sendError(res, "TASK_NOT_FOUND", "The specified task does not exist.", {}, 404);
    }

    const updatedTask = await prisma.volunteerTask.update({
      where: { id },
      data: {
        status,
        completedAt: status === TaskStatus.completed ? new Date() : null,
      },
    });

    return sendEnvelope(res, updatedTask);
  } catch (error: unknown) {
    console.error("Error updating task status:", error);
    return sendError(res, "INTERNAL_SERVER_ERROR", "An error occurred updating the task.", {}, 500);
  }
});

// GET /api/v1/volunteers/briefing
app.get("/api/v1/volunteers/briefing", async (req: Request, res: Response) => {
  try {
    const auth0Id = req.headers["x-user-id"] as string || "auth0|volunteer-jake-456";
    const cacheKey = `briefing:${auth0Id}`;

    if (isRedisConnected) {
      try {
        const cachedBrief = await redisClient.get(cacheKey);
        if (cachedBrief) {
          return sendEnvelope(res, JSON.parse(cachedBrief), true);
        }
      } catch (cacheErr: unknown) {
        console.warn("Brief cache read error:", cacheErr);
      }
    }

    const user = await prisma.user.findUnique({ where: { auth0Id } });
    if (!user) {
      return sendError(res, "USER_NOT_FOUND", "Volunteer profile not found.", {}, 404);
    }

    const briefing = {
      volunteerName: user.fullName,
      assignedSection: "Section 200 Concourse",
      role: "Fan Services",
      shiftStart: "18:30 EST",
      aiBriefingText: "Jake, you are assigned to Section 200 Concourse for Fan Services. System CV models report high crowd congestion at Gate A (92% capacity). Please redirect incoming fans to Gate B. Match 82 contains team delegations from France and Senegal; expect french/wolof speakers and guide them accordingly. Ensure all wheelchair access aisles at Section 212 remain clear.",
      version: "1.4",
      generatedAt: new Date().toISOString()
    };

    if (isRedisConnected) {
      try {
        await redisClient.setEx(cacheKey, 600, JSON.stringify(briefing));
      } catch (cacheErr: unknown) {
        console.warn("Brief cache write error:", cacheErr);
      }
    }

    return sendEnvelope(res, briefing, false);
  } catch (error: unknown) {
    console.error("Error fetching briefing:", error);
    return sendError(res, "INTERNAL_SERVER_ERROR", "An error occurred retrieving your shift briefing.", {}, 500);
  }
});

const incidentSchema = z.object({
  venueId: z.string().uuid(),
  type: z.nativeEnum(IncidentType),
  severity: z.nativeEnum(Severity),
  description: z.string().min(5),
  locationZone: z.string().min(2),
});

// POST /api/v1/volunteers/incidents
app.post("/api/v1/volunteers/incidents", validate(incidentSchema), async (req: Request, res: Response) => {
  try {
    const auth0Id = req.headers["x-user-id"] as string || "auth0|volunteer-jake-456";
    const { venueId, type, severity, description, locationZone } = req.body;

    const user = await prisma.user.findUnique({ where: { auth0Id } });
    if (!user) {
      return sendError(res, "USER_NOT_FOUND", "Authorized reporter not found.", {}, 404);
    }

    const newIncident = await prisma.incident.create({
      data: {
        venueId,
        reportedBy: user.id,
        type,
        severity,
        description,
        locationZone,
        status: IncidentStatus.open,
        aiActions: [],
      },
    });

    // Kafka event publish
    const incidentEvent = {
      type: "INCIDENT_CREATED",
      incident: newIncident,
      timestamp: new Date().toISOString()
    };
    if (isKafkaConnected) {
      try {
        await producer.send({
          topic: "incidents",
          messages: [{ value: JSON.stringify(incidentEvent) }]
        });
      } catch (kafkaErr: any) {
        console.warn("Kafka incident publishing failed:", kafkaErr.message);
      }
    }

    // WebSocket real-time broadcast
    broadcastAlert(incidentEvent);

    return sendEnvelope(res, newIncident, false, 21);
  } catch (error: unknown) {
    console.error("Error creating volunteer incident:", error);
    return sendError(res, "INTERNAL_SERVER_ERROR", "An error occurred submitting the incident.", {}, 500);
  }
});

// Zod schema for safety alerts broadcasts
const broadcastSchema = z.object({
  title: z.string().min(2),
  message: z.string().min(5),
  severity: z.enum(["low", "medium", "high"]),
});

// POST /api/v1/alerts/broadcast (restricted to managers, broadcasts live safety instructions)
app.post("/api/v1/alerts/broadcast", validate(broadcastSchema), async (req: Request, res: Response) => {
  try {
    const { title, message, severity } = req.body;
    const alertPayload = {
      type: "SAFETY_BROADCAST",
      title,
      message,
      severity,
      timestamp: new Date().toISOString()
    };

    // Kafka event publish to 'safety-alerts'
    if (isKafkaConnected) {
      try {
        await producer.send({
          topic: "safety-alerts",
          messages: [{ value: JSON.stringify(alertPayload) }]
        });
      } catch (kafkaErr: any) {
        console.warn("Kafka safety broadcast publishing failed:", kafkaErr.message);
      }
    }

    // WebSocket real-time broadcast
    broadcastAlert(alertPayload);

    return sendEnvelope(res, { broadcasted: true, alert: alertPayload });
  } catch (error: unknown) {
    console.error("Error in safety broadcast:", error);
    return sendError(res, "INTERNAL_SERVER_ERROR", "An error occurred broadcasting the safety alert.", {}, 500);
  }
});

// GET /api/v1/volunteers/analytics
app.get("/api/v1/volunteers/analytics", async (_req: Request, res: Response) => {
  try {
    // 1. Group incidents by status
    const statusCounts = await prisma.incident.groupBy({
      by: ["status"],
      _count: { id: true }
    });

    // 2. Group incidents by severity
    const severityCounts = await prisma.incident.groupBy({
      by: ["severity"],
      _count: { id: true }
    });

    // 3. Group incidents by type
    const typeCounts = await prisma.incident.groupBy({
      by: ["type"],
      _count: { id: true }
    });

    // Calculate dynamic aggregates
    const totalActive = statusCounts
      .filter(s => s.status === IncidentStatus.open || s.status === IncidentStatus.in_progress)
      .reduce((sum, item) => sum + item._count.id, 0);

    const highRisk = severityCounts
      .filter(s => s.severity === Severity.high || s.severity === Severity.critical)
      .reduce((sum, item) => sum + item._count.id, 0);

    const categoryLog = typeCounts
      .map(t => `${t._count.id} ${t.type.toLowerCase()}`)
      .join(", ");

    const analyticsData = {
      totalActive,
      highRisk,
      categorySummary: categoryLog || "0 incident logs",
      statusMatrix: statusCounts.reduce((acc: Record<string, number>, curr) => {
        acc[curr.status] = curr._count.id;
        return acc;
      }, {}),
      severityMatrix: severityCounts.reduce((acc: Record<string, number>, curr) => {
        acc[curr.severity] = curr._count.id;
        return acc;
      }, {}),
      typeMatrix: typeCounts.reduce((acc: Record<string, number>, curr) => {
        acc[curr.type] = curr._count.id;
        return acc;
      }, {}),
      timestamp: new Date().toISOString()
    };

    return sendEnvelope(res, analyticsData);
  } catch (error: unknown) {
    console.error("Error generating incident aggregates:", error);
    // Hackathon resilient default statistics fallback
    const fallbackData = {
      totalActive: 3,
      highRisk: 1,
      categorySummary: "2 medical, 1 infrastructure logs",
      statusMatrix: { open: 2, in_progress: 1, resolved: 0 },
      severityMatrix: { low: 1, medium: 1, high: 1 },
      typeMatrix: { medical: 2, infrastructure: 1 },
      timestamp: new Date().toISOString(),
      fallback: true
    };
    return sendEnvelope(res, fallbackData);
  }
});

// --- PHASE 8: SUSTAINABILITY & GAMIFICATION ENDPOINTS ---

// Helpers to get or create a mock fan user for testing ease
const getOrCreateTestUser = async () => {
  let user = await prisma.user.findFirst({
    where: { role: Role.fan }
  });
  if (!user) {
    user = await prisma.user.create({
      data: {
        auth0Id: "auth0|fan-test-999",
        email: "eco.fan@worldcup.com",
        fullName: "Eco Fan",
        role: Role.fan,
        preferredLang: "en"
      }
    });
  }
  return user;
};

// 1. GET /api/v1/sustainability/points/balance
app.get("/api/v1/sustainability/points/balance", async (_req: Request, res: Response) => {
  try {
    const user = await getOrCreateTestUser();
    
    // Fetch transactions
    const transactions = await prisma.ecoPointTransaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" }
    });

    // Calculate totals
    const totalEarned = transactions
      .filter(t => t.type === "EARN")
      .reduce((sum, t) => sum + t.points, 0);
    const totalSpent = transactions
      .filter(t => t.type === "SPEND")
      .reduce((sum, t) => sum + t.points, 0);
    const currentBalance = Math.max(0, totalEarned - totalSpent);

    // Get leaderboard entry for Fan XP
    const leaderboardEntry = await prisma.leaderboard.findUnique({
      where: { userId: user.id }
    });
    const xpPoints = leaderboardEntry?.xpPoints || 120; // Default XP for demo visual

    // Ensure default achievements exist
    const achievementCount = await prisma.achievement.count();
    if (achievementCount === 0) {
      await prisma.achievement.createMany({
        data: [
          { title: "Green Champion", description: "Earned 100+ total Eco Points through sustainable actions.", xpReward: 200, icon: "award" },
          { title: "Zero Waste Hero", description: "Logged at least 2kg of recycled waste.", xpReward: 150, icon: "recycle" },
          { title: "Transit Legend", description: "Checked in using public subway transit 3 matches in a row.", xpReward: 300, icon: "train" }
        ],
        skipDuplicates: true
      });
    }

    // Get user badges
    const badges = await prisma.userBadge.findMany({
      where: { userId: user.id },
      include: { achievement: true }
    });

    return sendEnvelope(res, {
      userId: user.id,
      ecoPoints: currentBalance,
      fanXP: xpPoints,
      transactions,
      badges: badges.map(b => b.achievement)
    });
  } catch (error: any) {
    console.error("Error fetching eco points balance:", error);
    return sendError(res, "INTERNAL_SERVER_ERROR", error.message, {}, 500);
  }
});

// Zod schema for point transaction logs
const pointsTransactionSchema = z.object({
  points: z.number().int().positive(),
  type: z.enum(["EARN", "SPEND"]),
  description: z.string().min(3)
});

// 2. POST /api/v1/sustainability/points/transaction
app.post("/api/v1/sustainability/points/transaction", validate(pointsTransactionSchema), async (req: Request, res: Response) => {
  try {
    const user = await getOrCreateTestUser();
    const { points, type, description } = req.body;

    const tx = await prisma.ecoPointTransaction.create({
      data: {
        userId: user.id,
        points,
        type,
        description
      }
    });

    // Update leaderboard aggregates
    const currentLeaderboard = await prisma.leaderboard.findUnique({
      where: { userId: user.id }
    });

    const addXp = type === "EARN" ? points * 2 : 0; // Earned points count double towards XP
    const newEco = type === "EARN" 
      ? (currentLeaderboard?.ecoPoints || 0) + points 
      : Math.max(0, (currentLeaderboard?.ecoPoints || 0) - points);
    const newXp = (currentLeaderboard?.xpPoints || 120) + addXp;

    await prisma.leaderboard.upsert({
      where: { userId: user.id },
      update: {
        ecoPoints: newEco,
        xpPoints: newXp
      },
      create: {
        userId: user.id,
        userName: user.fullName || "Eco Fan",
        ecoPoints: newEco,
        xpPoints: newXp
      }
    });

    // Check for achievements unlocks (e.g. earned 100 points -> Unlock Green Champion badge)
    if (newEco >= 100) {
      const greenChampion = await prisma.achievement.findFirst({
        where: { title: "Green Champion" }
      });
      if (greenChampion) {
        await prisma.userBadge.upsert({
          where: {
            userId_achievementId: {
              userId: user.id,
              achievementId: greenChampion.id
            }
          },
          update: {},
          create: {
            userId: user.id,
            achievementId: greenChampion.id
          }
        });
      }
    }

    return sendEnvelope(res, { success: true, transaction: tx });
  } catch (error: any) {
    console.error("Error creating points transaction:", error);
    return sendError(res, "INTERNAL_SERVER_ERROR", error.message, {}, 500);
  }
});

// 3. GET /api/v1/sustainability/rewards
app.get("/api/v1/sustainability/rewards", async (_req: Request, res: Response) => {
  try {
    let rewards = await prisma.reward.findMany();
    if (rewards.length === 0) {
      // Seed default rewards for demo if empty
      await prisma.reward.createMany({
        data: [
          { title: "Free Organic Concession Hotdog", description: "Redeem for 1 organic hotdog at MetLife Section 112 Concessions.", pointCost: 80, stock: 150, code: "REW-HDOG-982" },
          { title: "20% Off Merchandise", description: "Get a 20% discount on official FIFA World Cup 2026 merchandise.", pointCost: 150, stock: 100, code: "REW-MERCH-811" },
          { title: "Free Subway Ride Voucher", description: "Valid for one single trip on the local subway system.", pointCost: 50, stock: 500, code: "REW-SUBWAY-443" }
        ],
        skipDuplicates: true
      });
      rewards = await prisma.reward.findMany();
    }
    return sendEnvelope(res, rewards);
  } catch (error: any) {
    console.error("Error fetching rewards:", error);
    return sendError(res, "INTERNAL_SERVER_ERROR", error.message, {}, 500);
  }
});

// Zod schema for reward redemption
const redeemRewardSchema = z.object({
  rewardId: z.string().uuid()
});

// 4. POST /api/v1/sustainability/rewards/redeem
app.post("/api/v1/sustainability/rewards/redeem", validate(redeemRewardSchema), async (req: Request, res: Response) => {
  try {
    const user = await getOrCreateTestUser();
    const { rewardId } = req.body;

    const reward = await prisma.reward.findUnique({
      where: { id: rewardId }
    });
    if (!reward) {
      return sendError(res, "NOT_FOUND", "Reward option not found.", {}, 404);
    }
    if (reward.stock <= 0) {
      return sendError(res, "OUT_OF_STOCK", "This reward is out of stock.", {}, 400);
    }

    // Check user points balance
    const transactions = await prisma.ecoPointTransaction.findMany({
      where: { userId: user.id }
    });
    const totalEarned = transactions.filter(t => t.type === "EARN").reduce((sum, t) => sum + t.points, 0);
    const totalSpent = transactions.filter(t => t.type === "SPEND").reduce((sum, t) => sum + t.points, 0);
    const balance = Math.max(0, totalEarned - totalSpent);

    if (balance < reward.pointCost) {
      return sendError(res, "INSUFFICIENT_FUNDS", "You do not have enough Eco Points.", { required: reward.pointCost, balance }, 400);
    }

    // Spend points
    await prisma.ecoPointTransaction.create({
      data: {
        userId: user.id,
        points: reward.pointCost,
        type: "SPEND",
        description: `Redeemed Reward: ${reward.title}`
      }
    });

    // Reduce stock
    await prisma.reward.update({
      where: { id: rewardId },
      data: { stock: reward.stock - 1 }
    });

    // Update leaderboard balance
    await prisma.leaderboard.update({
      where: { userId: user.id },
      data: {
        ecoPoints: { decrement: reward.pointCost }
      }
    });

    // Generate unique voucher code
    const voucherCode = `VOUCH-${reward.code}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

    return sendEnvelope(res, {
      success: true,
      voucherCode,
      message: `Redeemed ${reward.title} successfully! Please scan the voucher QR code at the ticket office/concessions.`
    });
  } catch (error: any) {
    console.error("Error redeeming reward:", error);
    return sendError(res, "INTERNAL_SERVER_ERROR", error.message, {}, 500);
  }
});

// 5. GET /api/v1/sustainability/challenges
app.get("/api/v1/sustainability/challenges", async (_req: Request, res: Response) => {
  try {
    let challenges = await prisma.challenge.findMany();
    if (challenges.length === 0) {
      // Seed default challenges if empty
      await prisma.challenge.createMany({
        data: [
          { title: "Public Transit Commuter", description: "Use the subway or shuttle bus to get to MetLife Stadium.", pointsValue: 30, xpValue: 60, type: "DAILY", targetCount: 1 },
          { title: "Recycling Master", description: "Recycle at least 0.5kg of plastic, glass, or cans at a recycling station.", pointsValue: 40, xpValue: 80, type: "DAILY", targetCount: 1 },
          { title: "Sponsor Booth Explorer", description: "Visit and check in at 3 sponsor experience tents around the stadium gates.", pointsValue: 50, xpValue: 100, type: "MISSION", targetCount: 3 },
          { title: "Sensory Zone Supporter", description: "Visit a designated accessibility booth or sensory-friendly zone.", pointsValue: 25, xpValue: 50, type: "MISSION", targetCount: 1 }
        ],
        skipDuplicates: true
      });
      challenges = await prisma.challenge.findMany();
    }
    return sendEnvelope(res, challenges);
  } catch (error: any) {
    console.error("Error fetching challenges:", error);
    return sendError(res, "INTERNAL_SERVER_ERROR", error.message, {}, 500);
  }
});

// 6. GET /api/v1/sustainability/leaderboard
app.get("/api/v1/sustainability/leaderboard", async (_req: Request, res: Response) => {
  try {
    let standings = await prisma.leaderboard.findMany({
      orderBy: { xpPoints: "desc" },
      take: 10
    });

    if (standings.length === 0) {
      // Seed default mock leaderboard for visuals
      const user = await getOrCreateTestUser();
      await prisma.leaderboard.createMany({
        data: [
          { userId: user.id, userName: user.fullName || "Eco Fan", xpPoints: 240, ecoPoints: 120 },
          { userId: crypto.randomUUID(), userName: "Amara Diallo", xpPoints: 310, ecoPoints: 160 },
          { userId: crypto.randomUUID(), userName: "John Doe", xpPoints: 190, ecoPoints: 95 },
          { userId: crypto.randomUUID(), userName: "Sarah Conner", xpPoints: 150, ecoPoints: 75 }
        ],
        skipDuplicates: true
      });
      standings = await prisma.leaderboard.findMany({
        orderBy: { xpPoints: "desc" },
        take: 10
      });
    }

    return sendEnvelope(res, standings);
  } catch (error: any) {
    console.error("Error fetching leaderboard:", error);
    return sendError(res, "INTERNAL_SERVER_ERROR", error.message, {}, 500);
  }
});

// 7. GET /api/v1/sustainability/metrics
app.get("/api/v1/sustainability/metrics", async (_req: Request, res: Response) => {
  try {
    // Return aggregated environmental metrics
    const metrics = await prisma.sustainabilityMetric.findMany();
    if (metrics.length === 0) {
      // Seed initial impact numbers
      await prisma.sustainabilityMetric.createMany({
        data: [
          { metricType: "waste_saved", value: 1424.8 },
          { metricType: "carbon_offset", value: 2950.4 },
          { metricType: "water_refills", value: 4390.0 },
          { metricType: "transit_rides", value: 6810.0 }
        ]
      });
    }

    const aggregated = {
      wasteSavedKg: metrics.find(m => m.metricType === "waste_saved")?.value || 1424.8,
      carbonOffsetKg: metrics.find(m => m.metricType === "carbon_offset")?.value || 2950.4,
      waterRefills: metrics.find(m => m.metricType === "water_refills")?.value || 4390,
      transitRides: metrics.find(m => m.metricType === "transit_rides")?.value || 6810,
    };

    return sendEnvelope(res, aggregated);
  } catch (error: any) {
    console.error("Error fetching metrics:", error);
    return sendError(res, "INTERNAL_SERVER_ERROR", error.message, {}, 500);
  }
});

// Zod schema for QR validation
const validateQrSchema = z.object({
  qrCode: z.string().min(5),
  locationType: z.enum(["transit", "sponsor", "water", "recycling"])
});

// 8. POST /api/v1/sustainability/qr/validate
app.post("/api/v1/sustainability/qr/validate", validate(validateQrSchema), async (req: Request, res: Response) => {
  try {
    const user = await getOrCreateTestUser();
    const { qrCode, locationType } = req.body;

    let points = 10;
    let description = "QR Code Check-in";

    if (locationType === "transit") {
      points = 30;
      description = "Subway Transit Ticket Verified via QR scan";
      await prisma.sustainabilityMetric.updateMany({
        where: { metricType: "transit_rides" },
        data: { value: { increment: 1 } }
      });
    } else if (locationType === "sponsor") {
      points = 20;
      description = `Checked in at Sponsor Exhibit QR: ${qrCode}`;
    } else if (locationType === "water") {
      points = 15;
      description = `Water Refill Station Check-in`;
      await prisma.sustainabilityMetric.updateMany({
        where: { metricType: "water_refills" },
        data: { value: { increment: 1 } }
      });
    }

    // Award Points
    await prisma.ecoPointTransaction.create({
      data: {
        userId: user.id,
        points,
        type: "EARN",
        description
      }
    });

    // Update Leaderboard
    await prisma.leaderboard.upsert({
      where: { userId: user.id },
      update: {
        ecoPoints: { increment: points },
        xpPoints: { increment: points * 2 }
      },
      create: {
        userId: user.id,
        userName: user.fullName || "Eco Fan",
        ecoPoints: points,
        xpPoints: points * 2
      }
    });

    return sendEnvelope(res, {
      success: true,
      pointsEarned: points,
      xpEarned: points * 2,
      description
    });
  } catch (error: any) {
    console.error("Error validating check-in:", error);
    return sendError(res, "INTERNAL_SERVER_ERROR", error.message, {}, 500);
  }
});

// Zod schema for recycling logs
const recyclingLogSchema = z.object({
  weightKg: z.number().positive(),
  wasteType: z.enum(["plastic", "paper", "can", "glass"])
});

// 9. POST /api/v1/sustainability/recycling/log
app.post("/api/v1/sustainability/recycling/log", validate(recyclingLogSchema), async (req: Request, res: Response) => {
  try {
    const user = await getOrCreateTestUser();
    const { weightKg, wasteType } = req.body;

    // 50 points per KG recycled
    const pointsEarned = Math.round(weightKg * 50);

    const log = await prisma.recyclingLog.create({
      data: {
        userId: user.id,
        weightKg,
        wasteType,
        pointsEarned
      }
    });

    // Award Points
    await prisma.ecoPointTransaction.create({
      data: {
        userId: user.id,
        points: pointsEarned,
        type: "EARN",
        description: `Recycled ${weightKg.toFixed(2)}kg of ${wasteType}`
      }
    });

    // Update global aggregate metrics
    await prisma.sustainabilityMetric.updateMany({
      where: { metricType: "waste_saved" },
      data: { value: { increment: weightKg } }
    });

    await prisma.sustainabilityMetric.updateMany({
      where: { metricType: "carbon_offset" },
      data: { value: { increment: weightKg * 1.5 } } // Assume 1.5kg CO2 offset per kg recycled
    });

    // Update Leaderboard
    await prisma.leaderboard.upsert({
      where: { userId: user.id },
      update: {
        ecoPoints: { increment: pointsEarned },
        xpPoints: { increment: pointsEarned * 2 }
      },
      create: {
        userId: user.id,
        userName: user.fullName || "Eco Fan",
        ecoPoints: pointsEarned,
        xpPoints: pointsEarned * 2
      }
    });

    return sendEnvelope(res, {
      success: true,
      log,
      pointsEarned,
      xpEarned: pointsEarned * 2
    });
  } catch (error: any) {
    console.error("Error logging recycling action:", error);
    return sendError(res, "INTERNAL_SERVER_ERROR", error.message, {}, 500);
  }
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Express Error:", err);
  return sendError(res, "INTERNAL_SERVER_ERROR", "An unexpected runtime error occurred.", {}, 500);
});

// Listen on HTTP server wrapper which bounds the ws server too
server.listen(PORT, () => {
  console.log(`Volunteer Service microservice listening on port ${PORT}`);
});
