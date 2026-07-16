// ============================================================
// INCIDENT TYPES
// ============================================================

export type IncidentCategory =
  "crowd" | "medical" | "security" | "infrastructure" | "lost_item" | "other";

export type IncidentSeverity = "low" | "medium" | "high" | "critical";

export type IncidentStatus = "active" | "assigned" | "resolved";

export type IncidentSource = "volunteer" | "fan" | "system";

export interface Incident {
  readonly id: string;
  description: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  status: IncidentStatus;
  zone: string;
  reportedBy: IncidentSource;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// INCIDENT REDUCER ACTIONS
// ============================================================

export type IncidentAction =
  | { type: "ADD_INCIDENT"; payload: Incident }
  | { type: "UPDATE_STATUS"; payload: { id: string; status: IncidentStatus } }
  | {
      type: "UPDATE_SEVERITY";
      payload: { id: string; severity: IncidentSeverity };
    };

// ============================================================
// FORM TYPES
// ============================================================

export interface IncidentFormValues {
  description: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  zone: string;
}

export interface IncidentFormErrors {
  description?: string;
  category?: string;
  severity?: string;
  zone?: string;
}
