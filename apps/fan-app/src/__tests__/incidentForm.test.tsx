import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { VolunteerPortal } from "@/views/volunteer/VolunteerPortal";
import type { UseIncidentsReturn } from "@/hooks/useIncidents";

// Mock incident hook
const mockAddIncident = vi.fn().mockImplementation((values) => ({
  id: "INC-TEST",
  description: values.description,
  category: values.category,
  severity: values.severity,
  status: "active",
  zone: values.zone,
  reportedBy: "volunteer",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}));

const mockIncidentHook = {
  incidents: [],
  addIncident: mockAddIncident,
  updateStatus: vi.fn(),
  updateSeverity: vi.fn(),
  dispatch: vi.fn(),
} as unknown as UseIncidentsReturn;

describe("Report Incident Form Integration Test", () => {
  it("shows validation errors on empty submission, then succeeds when filled out correctly", async () => {
    render(
      <VolunteerPortal incidentHook={mockIncidentHook} registeredNeeds={[]} />,
    );

    // Switch to Report Incident tab
    const reportTab = screen.getByRole("tab", { name: /report/i });
    fireEvent.click(reportTab);

    // Submit immediately without filling out fields
    const submitBtn = screen.getByRole("button", {
      name: /submit incident report/i,
    });
    fireEvent.click(submitBtn);

    // Assert that validation errors are displayed
    expect(screen.getByText(/description is required/i)).toBeInTheDocument();
    expect(screen.getByText(/zone is required/i)).toBeInTheDocument();
    expect(mockAddIncident).not.toHaveBeenCalled();

    // Fill out Description and Zone
    const descriptionInput = screen.getByLabelText(/description/i);
    const zoneInput = screen.getByLabelText(/zone \/ location/i);
    const categorySelect = screen.getByLabelText(/category/i);
    const severitySelect = screen.getByLabelText(/severity/i);

    fireEvent.change(descriptionInput, {
      target: { value: "Crowd congestion observed near Gate A stairs" },
    });
    fireEvent.change(zoneInput, { target: { value: "Gate A Escalators" } });
    fireEvent.change(categorySelect, { target: { value: "crowd" } });
    fireEvent.change(severitySelect, { target: { value: "high" } });

    // Submit again
    fireEvent.click(submitBtn);

    // Assert that addIncident was called with correct values
    expect(mockAddIncident).toHaveBeenCalledWith(
      expect.objectContaining({
        description: "Crowd congestion observed near Gate A stairs",
        zone: "Gate A Escalators",
        category: "crowd",
        severity: "high",
        reportedBy: "volunteer",
      }),
    );

    // Assert success screen is displayed
    await waitFor(() => {
      expect(screen.getByText(/incident reported/i)).toBeInTheDocument();
      expect(screen.getByText(/INC-TEST/)).toBeInTheDocument();
    });
  });
});
