import { useEffect, useRef, useState, useCallback } from "react";
import { collection, onSnapshot, query, limit } from "firebase/firestore";
import { db } from "@/utils/firebase";
import { WebSocketEventSchema, type WebSocketEvent } from "@/types/events";

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

export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const { onSafetyBroadcast, onIncidentCreated } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<WebSocketEvent | null>(null);

  const onSafetyRef = useRef(onSafetyBroadcast);
  const onIncidentRef = useRef(onIncidentCreated);

  useEffect(() => { onSafetyRef.current = onSafetyBroadcast; }, [onSafetyBroadcast]);
  useEffect(() => { onIncidentRef.current = onIncidentCreated; }, [onIncidentCreated]);

  const dispatchEvent = useCallback((rawPayload: unknown): void => {
    const parseResult = WebSocketEventSchema.safeParse(rawPayload);
    if (!parseResult.success) {
      console.warn("[WebSocket/Firestore] Malformed event discarded:", parseResult.error.issues);
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

  // Listen to firestore incidents collection for real-time creation broadcasts
  useEffect(() => {
    setIsConnected(true);

    const q = query(collection(db, "incidents"), limit(5));
    const unsub = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const data = change.doc.data();
          dispatchEvent({
            type: "INCIDENT_CREATED",
            incident: {
              id: change.doc.id,
              description: data.description || "Active incident reported",
              category: data.category || "other",
              severity: data.severity || "medium",
              status: data.status || "active",
              zone: data.zone || "General",
              reportedBy: data.reportedBy || "fan",
              createdAt: data.createdAt || new Date().toISOString()
            }
          });
        }
      });
    });

    // Also listen to sustainability metrics for price drop state updates
    const unsubMetrics = onSnapshot(collection(db, "sustainability_metrics"), (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const data = change.doc.data();
        if (change.doc.id === "price_drop_state" && data.priceDropActive) {
          dispatchEvent({
            type: "SAFETY_BROADCAST",
            id: `BC-${Date.now()}`,
            title: "⚡ Concession Price Drop Alert",
            message: data.message || "Surplus organic hotdogs cost reduced by 50%!",
            severity: "medium",
            timestamp: new Date().toISOString()
          });
        }
      });
    });

    return () => {
      unsub();
      unsubMetrics();
      setIsConnected(false);
    };
  }, [dispatchEvent]);

  return { isConnected, lastEvent };
}
