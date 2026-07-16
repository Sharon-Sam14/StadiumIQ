import { useState, useEffect, useCallback } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/utils/firebase";
import type {
  Incident,
  IncidentStatus,
  IncidentSeverity,
  IncidentFormValues,
  IncidentAction,
} from "@/types/incidents";

export interface UseIncidentsReturn {
  incidents: Incident[];
  addIncident: (
    values: IncidentFormValues & { reportedBy?: Incident["reportedBy"] },
  ) => Promise<Incident>;
  updateStatus: (id: string, status: IncidentStatus) => Promise<void>;
  updateSeverity: (id: string, severity: IncidentSeverity) => Promise<void>;
  dispatch: React.Dispatch<IncidentAction>;
}

/**
 * React hook that manages safety incidents in real-time, syncing safety incident records
 * directly from Cloud Firestore collections. Handles status updates, severity upgrades,
 * and incident logging dispatches.
 *
 * @returns State and setter callback boundaries for incident coordination.
 */
export function useIncidents(): UseIncidentsReturn {
  const [incidents, setIncidents] = useState<Incident[]>([]);

  // Real-time Firestore synchronizer
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "incidents"), (snapshot) => {
      const list = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          description: data.description || "",
          category: data.category || "other",
          severity: data.severity || "medium",
          status: data.status || "active",
          zone: data.zone || "",
          reportedBy: data.reportedBy || "fan",
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
        } as Incident;
      });
      setIncidents(list);
    });
    return () => unsub();
  }, []);

  const addIncident = useCallback(
    async (
      values: IncidentFormValues & { reportedBy?: Incident["reportedBy"] },
    ): Promise<Incident> => {
      const now = new Date().toISOString();
      const payload = {
        description: values.description,
        category: values.category,
        severity: values.severity,
        zone: values.zone,
        status: "active" as IncidentStatus,
        reportedBy: values.reportedBy || "fan",
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await addDoc(collection(db, "incidents"), payload);
      return {
        id: docRef.id,
        ...payload,
      };
    },
    [],
  );

  const updateStatus = useCallback(
    async (id: string, status: IncidentStatus): Promise<void> => {
      const docRef = doc(db, "incidents", id);
      await updateDoc(docRef, {
        status,
        updatedAt: new Date().toISOString(),
      });
    },
    [],
  );

  const updateSeverity = useCallback(
    async (id: string, severity: IncidentSeverity): Promise<void> => {
      const docRef = doc(db, "incidents", id);
      await updateDoc(docRef, {
        severity,
        updatedAt: new Date().toISOString(),
      });
    },
    [],
  );

  const dispatch = useCallback((_action: IncidentAction) => {
    // Reducer dispatch is fully superseded by firestore updates
  }, []);

  return { incidents, addIncident, updateStatus, updateSeverity, dispatch };
}
