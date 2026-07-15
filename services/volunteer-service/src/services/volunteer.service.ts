import { prisma, TaskStatus, IncidentType, Severity, IncidentStatus, Role } from "@stadiumiq/database";
import { createClient } from "redis";
import { Kafka } from "kafkajs";
import { WebSocket } from "ws";
import crypto from "crypto";

// 1. Initialize Redis Client
const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
export const redisClient = createClient({ url: redisUrl });
export let isRedisConnected = false;

redisClient.connect()
  .then(() => {
    console.log("Volunteer Service Redis connected successfully.");
    isRedisConnected = true;
  })
  .catch((err) => {
    console.warn("Volunteer Service Redis connection failed:", err.message);
  });

// 2. Initialize Kafka Client
const kafkaBroker = process.env.KAFKA_BROKER || "localhost:9092";
const kafka = new Kafka({
  clientId: "volunteer-service",
  brokers: [kafkaBroker]
});
export const producer = kafka.producer();
export let isKafkaConnected = false;

producer.connect()
  .then(() => {
    console.log("Volunteer Service Kafka connected successfully.");
    isKafkaConnected = true;
  })
  .catch((err) => {
    console.warn("Volunteer Service Kafka connection failed:", err.message);
  });

// 3. WebSocket client registry
export const wsClients = new Set<WebSocket>();

export function broadcastAlert(payload: unknown) {
  const data = JSON.stringify(payload);
  for (const client of wsClients) {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(data);
      } catch (err) {
        console.error("WebSocket broadcast error:", err);
      }
    }
  }
}

export class VolunteerService {
  async getTasks(auth0Id: string) {
    const user = await prisma.user.findUnique({ where: { auth0Id } });
    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }
    return await prisma.volunteerTask.findMany({
      where: { volunteerId: user.id },
      orderBy: { createdAt: "desc" },
    });
  }

  async updateTask(id: string, status: TaskStatus) {
    const task = await prisma.volunteerTask.findUnique({ where: { id } });
    if (!task) {
      throw new Error("TASK_NOT_FOUND");
    }
    return await prisma.volunteerTask.update({
      where: { id },
      data: {
        status,
        completedAt: status === TaskStatus.completed ? new Date() : null,
      },
    });
  }

  async getBriefing(auth0Id: string) {
    const cacheKey = `briefing:${auth0Id}`;
    if (isRedisConnected) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          return { data: JSON.parse(cached), cacheHit: true };
        }
      } catch (err: any) {
        console.warn("Cache read error in briefing:", err.message);
      }
    }

    const user = await prisma.user.findUnique({ where: { auth0Id } });
    if (!user) {
      throw new Error("USER_NOT_FOUND");
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
      } catch (err: any) {
        console.warn("Cache write error in briefing:", err.message);
      }
    }

    return { data: briefing, cacheHit: false };
  }

  async createIncident(auth0Id: string, payload: { venueId: string; type: IncidentType; severity: Severity; description: string; locationZone: string }) {
    const user = await prisma.user.findUnique({ where: { auth0Id } });
    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    const incident = await prisma.incident.create({
      data: {
        venueId: payload.venueId,
        reportedBy: user.id,
        type: payload.type,
        severity: payload.severity,
        description: payload.description,
        locationZone: payload.locationZone,
        status: IncidentStatus.open,
        aiActions: [],
      },
    });

    const event = {
      type: "INCIDENT_CREATED",
      incident,
      timestamp: new Date().toISOString()
    };

    if (isKafkaConnected) {
      try {
        await producer.send({
          topic: "incidents",
          messages: [{ value: JSON.stringify(event) }]
        });
      } catch (err: any) {
        console.warn("Kafka incidents publish failed:", err.message);
      }
    }

    broadcastAlert(event);
    return incident;
  }

  async broadcastSafetyAlert(payload: { title: string; message: string; severity: string }) {
    const alert = {
      type: "SAFETY_BROADCAST",
      title: payload.title,
      message: payload.message,
      severity: payload.severity,
      timestamp: new Date().toISOString()
    };

    if (isKafkaConnected) {
      try {
        await producer.send({
          topic: "safety-alerts",
          messages: [{ value: JSON.stringify(alert) }]
        });
      } catch (err: any) {
        console.warn("Kafka safety-alerts publish failed:", err.message);
      }
    }

    broadcastAlert(alert);
    return alert;
  }

  async getAnalytics() {
    const statusCounts = await prisma.incident.groupBy({
      by: ["status"],
      _count: { id: true }
    });

    const severityCounts = await prisma.incident.groupBy({
      by: ["severity"],
      _count: { id: true }
    });

    const typeCounts = await prisma.incident.groupBy({
      by: ["type"],
      _count: { id: true }
    });

    const totalActive = statusCounts
      .filter(s => s.status === IncidentStatus.open || s.status === IncidentStatus.in_progress)
      .reduce((sum, item) => sum + item._count.id, 0);

    const highRisk = severityCounts
      .filter(s => s.severity === Severity.high || s.severity === Severity.critical)
      .reduce((sum, item) => sum + item._count.id, 0);

    const categoryLog = typeCounts
      .map(t => `${t._count.id} ${t.type.toLowerCase()}`)
      .join(", ");

    return {
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
  }

  // --- Sustainability / Gamification Operations ---
  
  async getOrCreateTestUser() {
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
  }

  async getPointsBalance(userId: string) {
    const transactions = await prisma.ecoPointTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });

    const totalEarned = transactions.filter(t => t.type === "EARN").reduce((sum, t) => sum + t.points, 0);
    const totalSpent = transactions.filter(t => t.type === "SPEND").reduce((sum, t) => sum + t.points, 0);
    const currentBalance = Math.max(0, totalEarned - totalSpent);

    const leaderboardEntry = await prisma.leaderboard.findUnique({ where: { userId } });
    const xpPoints = leaderboardEntry?.xpPoints || 120;

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

    const badges = await prisma.userBadge.findMany({
      where: { userId },
      include: { achievement: true }
    });

    return {
      userId,
      ecoPoints: currentBalance,
      fanXP: xpPoints,
      transactions,
      badges: badges.map(b => b.achievement)
    };
  }

  async createPointsTransaction(userId: string, points: number, type: "EARN" | "SPEND", description: string) {
    const tx = await prisma.ecoPointTransaction.create({
      data: { userId, points, type, description }
    });

    const currentLeaderboard = await prisma.leaderboard.findUnique({ where: { userId } });
    const addXp = type === "EARN" ? points * 2 : 0;
    const newEco = type === "EARN"
      ? (currentLeaderboard?.ecoPoints || 0) + points
      : Math.max(0, (currentLeaderboard?.ecoPoints || 0) - points);
    const newXp = (currentLeaderboard?.xpPoints || 120) + addXp;

    await prisma.leaderboard.upsert({
      where: { userId },
      update: { ecoPoints: newEco, xpPoints: newXp },
      create: { userId, userName: "Eco Fan", ecoPoints: newEco, xpPoints: newXp }
    });

    if (newEco >= 100) {
      const greenChampion = await prisma.achievement.findFirst({ where: { title: "Green Champion" } });
      if (greenChampion) {
        await prisma.userBadge.upsert({
          where: { userId_achievementId: { userId, achievementId: greenChampion.id } },
          update: {},
          create: { userId, achievementId: greenChampion.id }
        });
      }
    }

    return tx;
  }

  async getRewards() {
    let rewards = await prisma.reward.findMany();
    if (rewards.length === 0) {
      await prisma.reward.createMany({
        data: [
          { title: "Free Organic Concession Hotdog", description: "Redeem for 1 organic hotdog at MetLife concessions.", pointCost: 80, stock: 150, code: "REW-HDOG-982" },
          { title: "20% Off Merchandise", description: "Get a 20% discount on official merchandise.", pointCost: 150, stock: 100, code: "REW-MERCH-811" },
          { title: "Free Subway Ride Voucher", description: "Valid for one single trip on the subway.", pointCost: 50, stock: 500, code: "REW-SUBWAY-443" }
        ],
        skipDuplicates: true
      });
      rewards = await prisma.reward.findMany();
    }
    return rewards;
  }

  async redeemReward(userId: string, rewardId: string) {
    const reward = await prisma.reward.findUnique({ where: { id: rewardId } });
    if (!reward) throw new Error("REWARD_NOT_FOUND");
    if (reward.stock <= 0) throw new Error("OUT_OF_STOCK");

    const balanceData = await this.getPointsBalance(userId);
    if (balanceData.ecoPoints < reward.pointCost) {
      throw new Error("INSUFFICIENT_FUNDS");
    }

    await prisma.ecoPointTransaction.create({
      data: {
        userId,
        points: reward.pointCost,
        type: "SPEND",
        description: `Redeemed Reward: ${reward.title}`
      }
    });

    await prisma.reward.update({
      where: { id: rewardId },
      data: { stock: reward.stock - 1 }
    });

    await prisma.leaderboard.update({
      where: { userId },
      data: { ecoPoints: { decrement: reward.pointCost } }
    });

    return `VOUCH-${reward.code}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
  }

  async getChallenges() {
    let challenges = await prisma.challenge.findMany();
    if (challenges.length === 0) {
      await prisma.challenge.createMany({
        data: [
          { title: "Public Transit Commuter", description: "Use the subway or shuttle bus to get to MetLife Stadium.", pointsValue: 30, xpValue: 60, type: "DAILY", targetCount: 1 },
          { title: "Recycling Master", description: "Recycle at least 0.5kg of plastic, glass, or cans.", pointsValue: 40, xpValue: 80, type: "DAILY", targetCount: 1 },
          { title: "Sponsor Booth Explorer", description: "Visit and check in at 3 sponsor experience tents.", pointsValue: 50, xpValue: 100, type: "MISSION", targetCount: 3 },
          { title: "Sensory Zone Supporter", description: "Visit a designated accessibility booth.", pointsValue: 25, xpValue: 50, type: "MISSION", targetCount: 1 }
        ],
        skipDuplicates: true
      });
      challenges = await prisma.challenge.findMany();
    }
    return challenges;
  }

  async getLeaderboard() {
    let standings = await prisma.leaderboard.findMany({
      orderBy: { xpPoints: "desc" },
      take: 10
    });
    if (standings.length === 0) {
      const user = await this.getOrCreateTestUser();
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
    return standings;
  }

  async getSustainabilityMetrics() {
    const metrics = await prisma.sustainabilityMetric.findMany();
    if (metrics.length === 0) {
      await prisma.sustainabilityMetric.createMany({
        data: [
          { metricType: "waste_saved", value: 1424.8 },
          { metricType: "carbon_offset", value: 2950.4 },
          { metricType: "water_refills", value: 4390.0 },
          { metricType: "transit_rides", value: 6810.0 }
        ]
      });
    }

    const record = await prisma.sustainabilityMetric.findMany();
    return {
      wasteSavedKg: record.find(m => m.metricType === "waste_saved")?.value || 1424.8,
      carbonOffsetKg: record.find(m => m.metricType === "carbon_offset")?.value || 2950.4,
      waterRefills: record.find(m => m.metricType === "water_refills")?.value || 4390,
      transitRides: record.find(m => m.metricType === "transit_rides")?.value || 6810,
    };
  }

  async validateQr(userId: string, qrCode: string, locationType: string) {
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

    await prisma.ecoPointTransaction.create({
      data: { userId, points, type: "EARN", description }
    });

    await prisma.leaderboard.upsert({
      where: { userId },
      update: {
        ecoPoints: { increment: points },
        xpPoints: { increment: points * 2 }
      },
      create: { userId, userName: "Eco Fan", ecoPoints: points, xpPoints: points * 2 }
    });

    return { pointsEarned: points, xpEarned: points * 2, description };
  }

  async logRecycling(userId: string, weightKg: number, wasteType: "plastic" | "paper" | "can" | "glass") {
    const pointsEarned = Math.round(weightKg * 50);

    const log = await prisma.recyclingLog.create({
      data: { userId, weightKg, wasteType, pointsEarned }
    });

    await prisma.ecoPointTransaction.create({
      data: {
        userId,
        points: pointsEarned,
        type: "EARN",
        description: `Recycled ${weightKg.toFixed(2)}kg of ${wasteType}`
      }
    });

    await prisma.sustainabilityMetric.updateMany({
      where: { metricType: "waste_saved" },
      data: { value: { increment: weightKg } }
    });

    await prisma.sustainabilityMetric.updateMany({
      where: { metricType: "carbon_offset" },
      data: { value: { increment: weightKg * 1.5 } }
    });

    await prisma.leaderboard.upsert({
      where: { userId },
      update: {
        ecoPoints: { increment: pointsEarned },
        xpPoints: { increment: pointsEarned * 2 }
      },
      create: { userId, userName: "Eco Fan", ecoPoints: pointsEarned, xpPoints: pointsEarned * 2 }
    });

    return { log, pointsEarned };
  }
}
