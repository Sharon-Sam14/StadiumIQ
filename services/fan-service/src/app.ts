import express, { Response } from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import fanRouter from "./routes";

dotenv.config();

const app = express();

// Helmet headers for security hardening (OWASP compliance)
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || "*",
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-user-id"],
}));
app.use(express.json());

// Health check endpoint
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "healthy", service: "fan-service" });
});

// Routing
app.use("/api/v1/fans", fanRouter);

// Global error handler
app.use((err: Error, _req: any, res: Response, _next: any) => {
  console.error("Global Express Error in Fan-Service:", err.stack || err.message);
  return res.status(500).json({
    success: false,
    data: null,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: err.message || "An unexpected runtime error occurred.",
      details: process.env.NODE_ENV === "development" ? err.stack : {}
    }
  });
});

export default app;
