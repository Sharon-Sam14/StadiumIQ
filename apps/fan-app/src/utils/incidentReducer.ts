import type { Incident, IncidentAction, IncidentStatus, IncidentSeverity } from "@/types/incidents";
import { generateId } from "./formatters";

// ============================================================
// INCIDENT REDUCER — Pure reducer, no side effects
// ============================================================

export const initialIncidents: Incident[] = [
  {
    id: "INC-001",
    description: "Crowd surge detected at Gate A entrance",
    category: "crowd",
    severity: "high",
    status: "active",
    zone: "Gate A",
    reportedBy: "system",
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: "INC-002",
    description: "Elevator 4 (North Concourse) reported out of service",
    category: "infrastructure",
    severity: "medium",
    status: "assigned",
    zone: "North Concourse",
    reportedBy: "volunteer",
    createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
  },
  {
    id: "INC-003",
    description: "Smart waste bin overflow detected at Section 204",
    category: "infrastructure",
    severity: "low",
    status: "active",
    zone: "Section 204",
    reportedBy: "system",
    createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
  },
];

export function incidentReducer(state: Incident[], action: IncidentAction): Incident[] {
  switch (action.type) {
    case "ADD_INCIDENT": {
      // Prepend new incident to the top of the list
      return [action.payload, ...state];
    }

    case "UPDATE_STATUS": {
      const { id, status } = action.payload;
      return state.map((incident) =>
        incident.id === id
          ? { ...incident, status, updatedAt: new Date().toISOString() }
          : incident
      );
    }

    case "UPDATE_SEVERITY": {
      const { id, severity } = action.payload;
      return state.map((incident) =>
        incident.id === id
          ? { ...incident, severity, updatedAt: new Date().toISOString() }
          : incident
      );
    }

    default:
      return state;
  }
}

/**
 * Creates a new Incident object from a form submission.
 * Assigns generated ID, timestamp, and sets status to "active".
 */
export function createIncidentFromForm(values: {
  description: string;
  category: Incident["category"];
  severity: IncidentSeverity;
  zone: string;
  reportedBy?: Incident["reportedBy"];
}): Incident {
  const now = new Date().toISOString();
  return {
    id: `INC-${generateId("").toUpperCase().slice(0, 6)}`,
    description: values.description,
    category: values.category,
    severity: values.severity,
    status: "active" as IncidentStatus,
    zone: values.zone,
    reportedBy: values.reportedBy ?? "volunteer",
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Filters incidents by severity level.
 */
export function filterBySeverity(
  incidents: Incident[],
  severity: IncidentSeverity
): Incident[] {
  return incidents.filter((i) => i.severity === severity);
}
