import { describe, it, expect } from "vitest";
import {
  incidentReducer,
  initialIncidents,
  createIncidentFromForm,
  filterBySeverity,
} from "@/utils/incidentReducer";
import type { Incident } from "@/types/incidents";

// ============================================================
// INCIDENT REDUCER UNIT TESTS
// ============================================================

const sampleIncident: Incident = {
  id: "TEST-001",
  description: "Test crowd surge at Gate A",
  category: "crowd",
  severity: "high",
  status: "active",
  zone: "Gate A",
  reportedBy: "volunteer",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe("incidentReducer — ADD_INCIDENT", () => {
  it("prepends new incident to the list", () => {
    const newState = incidentReducer(initialIncidents, {
      type: "ADD_INCIDENT",
      payload: sampleIncident,
    });
    expect(newState[0].id).toBe("TEST-001");
    expect(newState.length).toBe(initialIncidents.length + 1);
  });

  it("preserves existing incidents when adding new one", () => {
    const newState = incidentReducer(initialIncidents, {
      type: "ADD_INCIDENT",
      payload: sampleIncident,
    });
    const existingIds = initialIncidents.map((i) => i.id);
    const preservedIds = newState.slice(1).map((i) => i.id);
    expect(preservedIds).toEqual(existingIds);
  });
});

describe("incidentReducer — UPDATE_STATUS", () => {
  it("updates status of the correct incident", () => {
    const targetId = initialIncidents[0].id;
    const newState = incidentReducer(initialIncidents, {
      type: "UPDATE_STATUS",
      payload: { id: targetId, status: "resolved" },
    });
    const updated = newState.find((i) => i.id === targetId);
    expect(updated?.status).toBe("resolved");
  });

  it("does not modify other incidents", () => {
    const targetId = initialIncidents[0].id;
    const newState = incidentReducer(initialIncidents, {
      type: "UPDATE_STATUS",
      payload: { id: targetId, status: "resolved" },
    });
    newState.slice(1).forEach((incident) => {
      const original = initialIncidents.find((i) => i.id === incident.id);
      expect(incident.status).toBe(original?.status);
    });
  });

  it("updates updatedAt timestamp when status changes", () => {
    const targetId = initialIncidents[0].id;
    const original = initialIncidents[0];
    const newState = incidentReducer(initialIncidents, {
      type: "UPDATE_STATUS",
      payload: { id: targetId, status: "assigned" },
    });
    const updated = newState.find((i) => i.id === targetId);
    expect(updated?.updatedAt).not.toBe(original.updatedAt);
  });
});

describe("incidentReducer — UPDATE_SEVERITY", () => {
  it("updates severity of correct incident", () => {
    const targetId = initialIncidents[0].id;
    const newState = incidentReducer(initialIncidents, {
      type: "UPDATE_SEVERITY",
      payload: { id: targetId, severity: "critical" },
    });
    const updated = newState.find((i) => i.id === targetId);
    expect(updated?.severity).toBe("critical");
  });
});

describe("createIncidentFromForm()", () => {
  it("creates an incident with status 'active'", () => {
    const incident = createIncidentFromForm({
      description: "Test incident description",
      category: "crowd",
      severity: "medium",
      zone: "Gate A",
    });
    expect(incident.status).toBe("active");
  });

  it("assigns a non-empty ID", () => {
    const incident = createIncidentFromForm({
      description: "Test",
      category: "medical",
      severity: "high",
      zone: "Sec 100",
    });
    expect(typeof incident.id).toBe("string");
    expect(incident.id.length).toBeGreaterThan(0);
  });

  it("defaults reportedBy to 'volunteer' when not specified", () => {
    const incident = createIncidentFromForm({
      description: "Test",
      category: "security",
      severity: "low",
      zone: "Gate B",
    });
    expect(incident.reportedBy).toBe("volunteer");
  });
});

describe("filterBySeverity()", () => {
  it("returns only incidents matching the given severity", () => {
    const filtered = filterBySeverity(initialIncidents, "high");
    filtered.forEach((i) => expect(i.severity).toBe("high"));
  });

  it("returns empty array when no incidents match", () => {
    const filtered = filterBySeverity(initialIncidents, "critical");
    expect(filtered).toEqual([]);
  });
});
