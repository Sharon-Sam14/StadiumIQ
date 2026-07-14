import { useReducer, useCallback } from "react";
import { incidentReducer, initialIncidents, createIncidentFromForm } from "@/utils/incidentReducer";
import type { Incident, IncidentAction, IncidentStatus, IncidentSeverity, IncidentFormValues } from "@/types/incidents";

// ============================================================
// USE INCIDENTS HOOK — shared state across Command Center & Volunteer Portal
// ============================================================

export interface UseIncidentsReturn {
  incidents: Incident[];
  addIncident: (values: IncidentFormValues & { reportedBy?: Incident["reportedBy"] }) => Incident;
  updateStatus: (id: string, status: IncidentStatus) => void;
  updateSeverity: (id: string, severity: IncidentSeverity) => void;
  dispatch: React.Dispatch<IncidentAction>;
}

export function useIncidents(): UseIncidentsReturn {
  const [incidents, dispatch] = useReducer(incidentReducer, initialIncidents);

  const addIncident = useCallback(
    (values: IncidentFormValues & { reportedBy?: Incident["reportedBy"] }): Incident => {
      const newIncident = createIncidentFromForm(values);
      dispatch({ type: "ADD_INCIDENT", payload: newIncident });
      return newIncident;
    },
    []
  );

  const updateStatus = useCallback((id: string, status: IncidentStatus): void => {
    dispatch({ type: "UPDATE_STATUS", payload: { id, status } });
  }, []);

  const updateSeverity = useCallback((id: string, severity: IncidentSeverity): void => {
    dispatch({ type: "UPDATE_SEVERITY", payload: { id, severity } });
  }, []);

  return { incidents, addIncident, updateStatus, updateSeverity, dispatch };
}
