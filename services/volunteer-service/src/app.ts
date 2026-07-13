import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import { z } from "zod";
import { prisma, TaskStatus, IncidentType, Severity, IncidentStatus } from "@stadiumiq/database";
import { createClient } from "redis";
import dotenv from "dotenv";

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

// GET /api/v1/volunteers/tasks (fetches tasks assigned to the volunteer, default to Jake Whitmore for demo)
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

// Zod schema for task status transition
const taskStatusSchema = z.object({
  status: z.nativeEnum(TaskStatus),
});

// PATCH /api/v1/volunteers/tasks/:id (updates a task's status)
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

// GET /api/v1/volunteers/briefing (fetches the AI generated pre-shift brief, cached in Redis)
app.get("/api/v1/volunteers/briefing", async (req: Request, res: Response) => {
  try {
    const auth0Id = req.headers["x-user-id"] as string || "auth0|volunteer-jake-456";
    const cacheKey = `briefing:${auth0Id}`;

    // Try reading cache
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

    // Mock an AI briefing structure grounded on database details
    const briefing = {
      volunteerName: user.fullName,
      assignedSection: "Section 200 Concourse",
      role: "Fan Services",
      shiftStart: "18:30 EST",
      aiBriefingText: "Jake, you are assigned to Section 200 Concourse for Fan Services. System CV models report high crowd congestion at Gate A (92% capacity). Please redirect incoming fans to Gate B. Match 82 contains team delegations from France and Senegal; expect french/wolof speakers and guide them accordingly. Ensure all wheelchair access aisles at Section 212 remain clear.",
      version: "1.4",
      generatedAt: new Date().toISOString()
    };

    // Cache briefing for 10 minutes
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

// Zod schema for incident logging
const incidentSchema = z.object({
  venueId: z.string().uuid(),
  type: z.nativeEnum(IncidentType),
  severity: z.nativeEnum(Severity),
  description: z.string().min(5),
  locationZone: z.string().min(2),
});

// POST /api/v1/volunteers/incidents (submits an incident report from a volunteer)
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

    return sendEnvelope(res, newIncident, false, 21);
  } catch (error: unknown) {
    console.error("Error creating volunteer incident:", error);
    return sendError(res, "INTERNAL_SERVER_ERROR", "An error occurred submitting the incident.", {}, 500);
  }
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Express Error:", err);
  return sendError(res, "INTERNAL_SERVER_ERROR", "An unexpected runtime error occurred.", {}, 500);
});

app.listen(PORT, () => {
  console.log(`Volunteer Service microservice listening on port ${PORT}`);
});
