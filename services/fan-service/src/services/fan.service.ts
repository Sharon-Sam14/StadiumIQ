import { prisma } from "@stadiumiq/database";
import { createClient } from "redis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const redisClient = createClient({ url: redisUrl });
let isRedisConnected = false;

redisClient.connect()
  .then(() => {
    console.log("Fan Service connected to Redis successfully in Service Layer.");
    isRedisConnected = true;
  })
  .catch((err) => {
    console.warn("Redis connection failed in Service Layer. Using fallback.", err.message);
  });

export class FanService {
  async getProfile(auth0Id: string) {
    return await prisma.user.findUnique({
      where: { auth0Id },
    });
  }

  async getTickets(auth0Id: string) {
    const cacheKey = `tickets:${auth0Id}`;
    if (isRedisConnected) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          return { data: JSON.parse(cached), cacheHit: true };
        }
      } catch (err: any) {
        console.warn("Redis read error in tickets:", err.message);
      }
    }

    const user = await prisma.user.findUnique({ where: { auth0Id } });
    if (!user) {
      return { data: [], cacheHit: false };
    }

    const tickets = await prisma.ticket.findMany({
      where: { fanId: user.id },
      include: {
        match: {
          include: { venue: true }
        }
      }
    });

    if (isRedisConnected && tickets.length > 0) {
      try {
        await redisClient.setEx(cacheKey, 300, JSON.stringify(tickets));
      } catch (err: any) {
        console.warn("Redis write error in tickets:", err.message);
      }
    }

    return { data: tickets, cacheHit: false };
  }

  async createIncident(auth0Id: string, payload: { venueId: string; type: any; severity: any; description: string; locationZone: string }) {
    const user = await prisma.user.findUnique({ where: { auth0Id } });
    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    return await prisma.incident.create({
      data: {
        venueId: payload.venueId,
        reportedBy: user.id,
        type: payload.type,
        severity: payload.severity,
        description: payload.description,
        locationZone: payload.locationZone,
        status: "open",
        aiActions: [],
      },
    });
  }
}
