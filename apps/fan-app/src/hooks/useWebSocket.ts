import { useEffect, useRef, useState, useCallback } from "react";
import { WebSocketEventSchema, type WebSocketEvent } from "@/types/events";

// ============================================================
// SIMULATED WEBSOCKET HOOK
// Uses setInterval to simulate real-time events.
// All events validated with Zod before reaching state.
// ============================================================

const SAFETY_BROADCASTS = [
  {
    title: "Gate A Congestion Advisory",
    message: "Gate A occupancy has reached 92%. All Section 200–250 ticketholders are advised to use Gate B for faster entry.",
    severity: "high" as const,
  },
  {
    title: "Stadium Weather Update",
    message: "Light rain expected at 21:00. East concourse entry doors have been opened for shelter.",
    severity: "medium" as const,
  },
  {
    title: "Transport Advisory",
    message: "NJ Transit special service running 15 min ahead of schedule post-match. Board at Meadowlands Station.",
    severity: "low" as const,
  },
];

const INCIDENT_EVENTS = [
  {
    description: "Fan reported feeling unwell near Section 110, medical team dispatched",
    category: "medical" as const,
    zone: "Section 110",
  },
  {
    description: "Unauthorised access attempt detected at Staff Entrance B",
    category: "security" as const,
    zone: "Staff Entrance B",
  },
  {
    description: "Concourse 3 food vendor queue exceeding safe capacity",
    category: "crowd" as const,
    zone: "Concourse 3",
  },
];

interface UseWebSocketOptions {
  onSafetyBroadcast?: (event: WebSocketEvent & { type: "SAFETY_BROADCAST" }) => void;
  onIncidentCreated?: (event: WebSocketEvent & { type: "INCIDENT_CREATED" }) => void;
  broadcastIntervalMs?: number;
  incidentIntervalMs?: number;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  lastEvent: WebSocketEvent | null;
}

let broadcastIndex = 0;
let incidentIndex = 0;

export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const {
    onSafetyBroadcast,
    onIncidentCreated,
    broadcastIntervalMs = 45000,
    incidentIntervalMs = 75000,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<WebSocketEvent | null>(null);

  const onSafetyRef = useRef(onSafetyBroadcast);
  const onIncidentRef = useRef(onIncidentCreated);

  useEffect(() => { onSafetyRef.current = onSafetyBroadcast; }, [onSafetyBroadcast]);
  useEffect(() => { onIncidentRef.current = onIncidentCreated; }, [onIncidentCreated]);

  const dispatchEvent = useCallback((rawPayload: unknown): void => {
    const parseResult = WebSocketEventSchema.safeParse(rawPayload);
    if (!parseResult.success) {
      console.warn("[WebSocket] Malformed event discarded:", parseResult.error.issues);
      return;
    }
    const event = parseResult.data;
    setLastEvent(event);

    if (event.type === "SAFETY_BROADCAST") {
      onSafetyRef.current?.(event);
    } else if (event.type === "INCIDENT_CREATED") {
      onIncidentRef.current?.(event);
    }
  }, []);

  useEffect(() => {
    // Simulate connection established
    const connectTimer = setTimeout(() => setIsConnected(true), 500);

    // Safety broadcast interval
    const broadcastTimer = setInterval(() => {
      const template = SAFETY_BROADCASTS[broadcastIndex % SAFETY_BROADCASTS.length];
      broadcastIndex++;
      dispatchEvent({
        type: "SAFETY_BROADCAST",
        id: `BC-${Date.now()}`,
        title: template.title,
        message: template.message,
        severity: template.severity,
        timestamp: new Date().toISOString(),
      });
    }, broadcastIntervalMs);

    // Incident created interval
    const incidentTimer = setInterval(() => {
      const template = INCIDENT_EVENTS[incidentIndex % INCIDENT_EVENTS.length];
      incidentIndex++;
      dispatchEvent({
        type: "INCIDENT_CREATED",
        incident: {
          id: `INC-${Date.now().toString(36).toUpperCase()}`,
          description: template.description,
          category: template.category,
          severity: "medium",
          status: "active",
          zone: template.zone,
          reportedBy: "system",
          createdAt: new Date().toISOString(),
        },
      });
    }, incidentIntervalMs);

    return () => {
      clearTimeout(connectTimer);
      clearInterval(broadcastTimer);
      clearInterval(incidentTimer);
      setIsConnected(false);
    };
  }, [broadcastIntervalMs, incidentIntervalMs, dispatchEvent]);

  return { isConnected, lastEvent };
}
