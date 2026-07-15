import { Request, Response, NextFunction } from "express";
import { VolunteerService } from "../services/volunteer.service";
import { z } from "zod";
import { TaskStatus, IncidentType, Severity } from "@stadiumiq/database";

const volunteerService = new VolunteerService();

const taskStatusSchema = z.object({
  status: z.nativeEnum(TaskStatus),
});

const incidentSchema = z.object({
  venueId: z.string().uuid(),
  type: z.nativeEnum(IncidentType),
  severity: z.nativeEnum(Severity),
  description: z.string().min(5),
  locationZone: z.string().min(2),
});

const broadcastSchema = z.object({
  title: z.string().min(2),
  message: z.string().min(5),
  severity: z.enum(["low", "medium", "high"]),
});

const pointsTransactionSchema = z.object({
  points: z.number().int().positive(),
  type: z.enum(["EARN", "SPEND"]),
  description: z.string().min(3)
});

const redeemRewardSchema = z.object({
  rewardId: z.string().uuid()
});

const validateQrSchema = z.object({
  qrCode: z.string().min(5),
  locationType: z.enum(["transit", "sponsor", "water", "recycling"])
});

const recyclingLogSchema = z.object({
  weightKg: z.number().positive(),
  wasteType: z.enum(["plastic", "paper", "can", "glass"])
});

export class VolunteerController {
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

  async getTasks(req: Request, res: Response, next: NextFunction) {
    try {
      const auth0Id = req.headers["x-user-id"] as string || "auth0|volunteer-jake-456";
      const tasks = await volunteerService.getTasks(auth0Id);
      VolunteerController.sendEnvelope(res, tasks);
      return;
    } catch (error: any) {
      if (error.message === "USER_NOT_FOUND") {
        VolunteerController.sendError(res, "USER_NOT_FOUND", "Volunteer profile not found.", {}, 404);
        return;
      }
      next(error);
      return;
    }
  }

  async updateTask(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = taskStatusSchema.parse(req.body);
      const updated = await volunteerService.updateTask(id, status);
      VolunteerController.sendEnvelope(res, updated);
      return;
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        VolunteerController.sendError(res, "VALIDATION_FAILED", "Validation failed", error.flatten());
        return;
      }
      if (error.message === "TASK_NOT_FOUND") {
        VolunteerController.sendError(res, "TASK_NOT_FOUND", "The specified task does not exist.", {}, 404);
        return;
      }
      next(error);
      return;
    }
  }

  async getBriefing(req: Request, res: Response, next: NextFunction) {
    try {
      const auth0Id = req.headers["x-user-id"] as string || "auth0|volunteer-jake-456";
      const { data, cacheHit } = await volunteerService.getBriefing(auth0Id);
      VolunteerController.sendEnvelope(res, data, cacheHit);
      return;
    } catch (error: any) {
      if (error.message === "USER_NOT_FOUND") {
        VolunteerController.sendError(res, "USER_NOT_FOUND", "Volunteer profile not found.", {}, 404);
        return;
      }
      next(error);
      return;
    }
  }

  async createIncident(req: Request, res: Response, next: NextFunction) {
    try {
      const auth0Id = req.headers["x-user-id"] as string || "auth0|volunteer-jake-456";
      const validated = incidentSchema.parse(req.body);
      const incident = await volunteerService.createIncident(auth0Id, validated);
      VolunteerController.sendEnvelope(res, incident, false, 201);
      return;
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        VolunteerController.sendError(res, "VALIDATION_FAILED", "Validation failed", error.flatten());
        return;
      }
      if (error.message === "USER_NOT_FOUND") {
        VolunteerController.sendError(res, "USER_NOT_FOUND", "Authorized reporter not found.", {}, 404);
        return;
      }
      next(error);
      return;
    }
  }

  async broadcastSafetyAlert(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = broadcastSchema.parse(req.body);
      const alert = await volunteerService.broadcastSafetyAlert(validated);
      VolunteerController.sendEnvelope(res, { broadcasted: true, alert });
      return;
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        VolunteerController.sendError(res, "VALIDATION_FAILED", "Validation failed", error.flatten());
        return;
      }
      next(error);
      return;
    }
  }

  async getAnalytics(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await volunteerService.getAnalytics();
      VolunteerController.sendEnvelope(res, data);
      return;
    } catch (error: any) {
      next(error);
      return;
    }
  }

  async getPointsBalance(_req: Request, res: Response, next: NextFunction) {
    try {
      const user = await volunteerService.getOrCreateTestUser();
      const balance = await volunteerService.getPointsBalance(user.id);
      VolunteerController.sendEnvelope(res, balance);
      return;
    } catch (error: any) {
      next(error);
      return;
    }
  }

  async createPointsTransaction(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await volunteerService.getOrCreateTestUser();
      const { points, type, description } = pointsTransactionSchema.parse(req.body);
      const tx = await volunteerService.createPointsTransaction(user.id, points, type, description);
      VolunteerController.sendEnvelope(res, { success: true, transaction: tx });
      return;
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        VolunteerController.sendError(res, "VALIDATION_FAILED", "Validation failed", error.flatten());
        return;
      }
      next(error);
      return;
    }
  }

  async getRewards(_req: Request, res: Response, next: NextFunction) {
    try {
      const rewards = await volunteerService.getRewards();
      VolunteerController.sendEnvelope(res, rewards);
      return;
    } catch (error: any) {
      next(error);
      return;
    }
  }

  async redeemReward(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await volunteerService.getOrCreateTestUser();
      const { rewardId } = redeemRewardSchema.parse(req.body);
      const code = await volunteerService.redeemReward(user.id, rewardId);
      VolunteerController.sendEnvelope(res, {
        success: true,
        voucherCode: code,
        message: "Voucher redeemed successfully!"
      });
      return;
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        VolunteerController.sendError(res, "VALIDATION_FAILED", "Validation failed", error.flatten());
        return;
      }
      if (error.message === "REWARD_NOT_FOUND") {
        VolunteerController.sendError(res, "NOT_FOUND", "Reward option not found.", {}, 404);
        return;
      }
      if (error.message === "OUT_OF_STOCK") {
        VolunteerController.sendError(res, "OUT_OF_STOCK", "This reward is out of stock.", {}, 400);
        return;
      }
      if (error.message === "INSUFFICIENT_FUNDS") {
        VolunteerController.sendError(res, "INSUFFICIENT_FUNDS", "You do not have enough Eco Points.", {}, 400);
        return;
      }
      next(error);
      return;
    }
  }

  async getChallenges(_req: Request, res: Response, next: NextFunction) {
    try {
      const challenges = await volunteerService.getChallenges();
      VolunteerController.sendEnvelope(res, challenges);
      return;
    } catch (error: any) {
      next(error);
      return;
    }
  }

  async getLeaderboard(_req: Request, res: Response, next: NextFunction) {
    try {
      const leaderboard = await volunteerService.getLeaderboard();
      VolunteerController.sendEnvelope(res, leaderboard);
      return;
    } catch (error: any) {
      next(error);
      return;
    }
  }

  async getSustainabilityMetrics(_req: Request, res: Response, next: NextFunction) {
    try {
      const metrics = await volunteerService.getSustainabilityMetrics();
      VolunteerController.sendEnvelope(res, metrics);
      return;
    } catch (error: any) {
      next(error);
      return;
    }
  }

  async validateQr(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await volunteerService.getOrCreateTestUser();
      const { qrCode, locationType } = validateQrSchema.parse(req.body);
      const data = await volunteerService.validateQr(user.id, qrCode, locationType);
      VolunteerController.sendEnvelope(res, {
        success: true,
        ...data
      });
      return;
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        VolunteerController.sendError(res, "VALIDATION_FAILED", "Validation failed", error.flatten());
        return;
      }
      next(error);
      return;
    }
  }

  async logRecycling(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await volunteerService.getOrCreateTestUser();
      const { weightKg, wasteType } = recyclingLogSchema.parse(req.body);
      const data = await volunteerService.logRecycling(user.id, weightKg, wasteType);
      VolunteerController.sendEnvelope(res, {
        success: true,
        ...data
      });
      return;
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        VolunteerController.sendError(res, "VALIDATION_FAILED", "Validation failed", error.flatten());
        return;
      }
      next(error);
      return;
    }
  }
}
