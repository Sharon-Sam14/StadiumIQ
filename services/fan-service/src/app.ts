import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import { z } from "zod";
import { prisma, IncidentType, Severity, IncidentStatus } from "@stadiumiq/database";
import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors());
app.use(express.json());

// 1. Initialize Redis Client with failover
const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const redisClient = createClient({ url: redisUrl });
let isRedisConnected = false;

redisClient.connect()
  .then(() => {
    console.log("Fan Service connected to Redis cache successfully.");
    isRedisConnected = true;
  })
  .catch((err) => {
    console.warn("Redis connection failed. Falling back to direct database reads.", err.message);
  });

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

// 2. REST Endpoints

// GET /api/v1/fans/me (fetches profile of logged-in user, default to Priya for demo)
app.get("/api/v1/fans/me", async (req: Request, res: Response) => {
  try {
    const auth0Id = req.headers["x-user-id"] as string || "auth0|fan-priya-789";
    const user = await prisma.user.findUnique({
      where: { auth0Id },
    });

    if (!user) {
      return sendError(res, "USER_NOT_FOUND", "Profile details not found.", {}, 404);
    }

    return sendEnvelope(res, user);
  } catch (error: unknown) {
    console.error("Error in get profile:", error);
    return sendError(res, "INTERNAL_SERVER_ERROR", "An error occurred retrieving your profile.", {}, 500);
  }
});

// GET /api/v1/fans/tickets (fetches tickets for logged-in user, using Redis cache)
app.get("/api/v1/fans/tickets", async (req: Request, res: Response) => {
  try {
    const auth0Id = req.headers["x-user-id"] as string || "auth0|fan-priya-789";
    const cacheKey = `tickets:${auth0Id}`;

    // Try reading from cache
    if (isRedisConnected) {
      try {
        const cachedTickets = await redisClient.get(cacheKey);
        if (cachedTickets) {
          return sendEnvelope(res, JSON.parse(cachedTickets), true);
        }
      } catch (cacheErr: unknown) {
        console.warn("Cache read error:", cacheErr);
      }
    }

    // Direct Database Query
    const user = await prisma.user.findUnique({
      where: { auth0Id },
    });

    if (!user) {
      return sendError(res, "USER_NOT_FOUND", "Priya Sharma user record not found.", {}, 404);
    }

    const tickets = await prisma.ticket.findMany({
      where: { fanId: user.id },
      include: {
        match: {
          include: {
            venue: true
          }
        }
      }
    });

    // Save to cache for 5 minutes
    if (isRedisConnected) {
      try {
        await redisClient.setEx(cacheKey, 300, JSON.stringify(tickets));
      } catch (cacheErr: unknown) {
        console.warn("Cache write error:", cacheErr);
      }
    }

    return sendEnvelope(res, tickets, false);
  } catch (error: unknown) {
    console.error("Error in get tickets:", error);
    return sendError(res, "INTERNAL_SERVER_ERROR", "An error occurred retrieving your tickets.", {}, 500);
  }
});

// Zod schema for incident logging
const incidentSchema = z.object({
  venueId: z.string().uuid(),
  type: z.nativeEnum(IncidentType),
  severity: z.nativeEnum(Severity),
  description: z.string().min(5),
  locationZone: z.string().min(2),
});

// POST /api/v1/fans/incidents (logs an incident from a fan report)
app.post("/api/v1/fans/incidents", validate(incidentSchema), async (req: Request, res: Response) => {
  try {
    const auth0Id = req.headers["x-user-id"] as string || "auth0|fan-priya-789";
    const { venueId, type, severity, description, locationZone } = req.body;

    const user = await prisma.user.findUnique({ where: { auth0Id } });
    if (!user) {
      return sendError(res, "USER_NOT_FOUND", "Authorized reporter not found.", {}, 404);
    }

    // Log the incident in the database
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

    return sendEnvelope(res, newIncident, false, 21);
  } catch (error: unknown) {
    console.error("Error creating incident:", error);
    return sendError(res, "INTERNAL_SERVER_ERROR", "An error occurred submitting the incident.", {}, 500);
  }
});

// Express global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Express Error:", err);
  return sendError(res, "INTERNAL_SERVER_ERROR", "An unexpected runtime error occurred.", {}, 500);
});

app.listen(PORT, () => {
  console.log(`Fan Service microservice listening on port ${PORT}`);
});
