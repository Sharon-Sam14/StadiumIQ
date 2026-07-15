import { Request, Response, NextFunction } from "express";
import { TransportService } from "../services/transport.service";

const transportService = new TransportService();

export class TransportController {
  static sendEnvelope(res: Response, data: unknown, status = 200) {
    res.status(status).json({
      success: true,
      data,
      meta: {
        requestId: `req_${Math.random().toString(36).substring(2, 9)}`,
        timestamp: new Date().toISOString(),
        version: "v1"
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

  async getTransitInfo(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await transportService.getTransitInfo();
      TransportController.sendEnvelope(res, data);
      return;
    } catch (error) {
      next(error);
      return;
    }
  }
}
