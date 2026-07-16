import { z } from "zod";

// ============================================================
// ZOD SCHEMAS — WebSocket Event Validation
// ============================================================

export const SafetyBroadcastEventSchema = z.object({
  type: z.literal("SAFETY_BROADCAST"),
  id: z.string(),
  title: z.string(),
  message: z.string(),
  severity: z.enum(["low", "medium", "high"]),
  timestamp: z.string(),
});

export const IncidentCreatedEventSchema = z.object({
  type: z.literal("INCIDENT_CREATED"),
  incident: z.object({
    id: z.string(),
    description: z.string(),
    category: z.enum([
      "crowd",
      "medical",
      "security",
      "infrastructure",
      "lost_item",
      "other",
    ]),
    severity: z.enum(["low", "medium", "high", "critical"]),
    status: z.enum(["active", "assigned", "resolved"]),
    zone: z.string().optional(),
    reportedBy: z.enum(["volunteer", "fan", "system"]),
    createdAt: z.string(),
  }),
});

export const WebSocketEventSchema = z.discriminatedUnion("type", [
  SafetyBroadcastEventSchema,
  IncidentCreatedEventSchema,
]);

// ============================================================
// TYPESCRIPT TYPES
// ============================================================

export type SafetyBroadcastEvent = z.infer<typeof SafetyBroadcastEventSchema>;
export type IncidentCreatedEvent = z.infer<typeof IncidentCreatedEventSchema>;
export type WebSocketEvent = z.infer<typeof WebSocketEventSchema>;

export type EventSeverity = "low" | "medium" | "high";
