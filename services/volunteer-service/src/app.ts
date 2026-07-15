import express, { Response } from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import http from "http";
import { WebSocketServer } from "ws";
import { wsClients } from "./services/volunteer.service";
import volunteerRouter from "./routes";

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
  res.status(200).json({ status: "healthy", service: "volunteer-service" });
});

// Routing
app.use("/api", volunteerRouter);

// Global Error Handler
app.use((err: Error, _req: any, res: Response, _next: any) => {
  console.error("Global Express Error in Volunteer-Service:", err.stack || err.message);
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

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  wsClients.add(ws);
  console.log(`New WebSocket connection established. Total clients: ${wsClients.size}`);

  ws.on("close", () => {
    wsClients.delete(ws);
    console.log(`WebSocket client disconnected. Total clients: ${wsClients.size}`);
  });

  ws.send(JSON.stringify({ type: "WELCOME", message: "Connected to StadiumIQ alerts broker." }));
});

export { app, server };
export default app;
