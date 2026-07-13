import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;

app.use(helmet());
app.use(cors());
app.use(express.json());

// Standard API response envelope helper
function sendEnvelope(res: Response, data: unknown, status = 200) {
  return res.status(status).json({
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

// REST Endpoints
app.get("/api/v1/transport", (_req: Request, res: Response) => {
  try {
    const transitInfo = {
      busSchedules: [
        { routeId: "161", destination: "New York Port Authority", nextArrival: "12 mins", status: "on_time" },
        { routeId: "355", destination: "Secaucus Junction", nextArrival: "5 mins", status: "delayed" }
      ],
      parkingZones: [
        { zone: "Lot A (VIP)", totalSpaces: 800, occupied: 792, occupancyRate: "99%", status: "full" },
        { zone: "Lot B (General)", totalSpaces: 4500, occupied: 2900, occupancyRate: "64%", status: "available" }
      ],
      rideshareETAMinutes: {
        uber: 7,
        lyft: 9
      }
    };

    return sendEnvelope(res, transitInfo);
  } catch (error: unknown) {
    console.error("Error fetching transit details:", error);
    return sendError(res, "INTERNAL_SERVER_ERROR", "An error occurred retrieving transit data.", {}, 500);
  }
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Express Error:", err);
  return sendError(res, "INTERNAL_SERVER_ERROR", "An unexpected runtime error occurred.", {}, 500);
});

app.listen(PORT, () => {
  console.log(`Transport Service microservice listening on port ${PORT}`);
});
