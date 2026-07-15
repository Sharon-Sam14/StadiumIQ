import express, { Response } from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import transportRouter from "./routes";

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || "*",
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-user-id"],
}));
app.use(express.json());

// Health check endpoint
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "healthy", service: "transport-service" });
});

// Routing
app.use("/api/v1/transport", transportRouter);

// Global Error Handler
app.use((err: Error, _req: any, res: Response, _next: any) => {
  console.error("Global Express Error in Transport-Service:", err.stack || err.message);
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
