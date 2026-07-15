import { Request, Response, NextFunction } from "express";
import { FanService } from "../services/fan.service";
import { z } from "zod";

const fanService = new FanService();

const incidentSchema = z.object({
  venueId: z.string().uuid(),
  type: z.enum(["medical", "crowd", "security", "infrastructure", "lost_item", "other"]),
  severity: z.enum(["low", "medium", "high", "critical"]),
  description: z.string().min(5),
  locationZone: z.string().min(2),
});

export class FanController {
  static sendEnvelope(res: Response, data: unknown, cacheHit = false, status = 200) {
    res.status(status).json({
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

  static sendError(res: Response, code: string, message: string, details = {}, status = 400) {
    res.status(status).json({
      success: false,
      data: null,
      error: {
        code,
        message,
        details
      }
    });
  }

  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const auth0Id = req.headers["x-user-id"] as string || "auth0|fan-priya-789";
      const user = await fanService.getProfile(auth0Id);

      if (!user) {
        FanController.sendError(res, "USER_NOT_FOUND", "Profile details not found.", {}, 404);
        return;
      }

      FanController.sendEnvelope(res, user);
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  async getTickets(req: Request, res: Response, next: NextFunction) {
    try {
      const auth0Id = req.headers["x-user-id"] as string || "auth0|fan-priya-789";
      const { data, cacheHit } = await fanService.getTickets(auth0Id);
      FanController.sendEnvelope(res, data, cacheHit);
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  async createIncident(req: Request, res: Response, next: NextFunction) {
    try {
      const auth0Id = req.headers["x-user-id"] as string || "auth0|fan-priya-789";
      const validated = incidentSchema.parse(req.body);

      const incident = await fanService.createIncident(auth0Id, validated);
      FanController.sendEnvelope(res, incident, false, 201);
      return;
    } catch (error) {
      if (error instanceof z.ZodError) {
        FanController.sendError(res, "VALIDATION_FAILED", "Input validation failed.", error.flatten(), 400);
        return;
      }
      if (error instanceof Error && error.message === "USER_NOT_FOUND") {
        FanController.sendError(res, "USER_NOT_FOUND", "Profile details not found.", {}, 404);
        return;
      }
      next(error);
      return;
    }
  }
}
