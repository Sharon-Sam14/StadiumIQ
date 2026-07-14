import { useState, useCallback } from "react";
import type { AccessibilityNeed } from "@/types/fan";

// ============================================================
// USE ACCESSIBILITY NEEDS HOOK
// Shared state — fan registers needs in Fan Portal,
// volunteeer sees them in Volunteer Portal Briefing tab.
// ============================================================

export interface RegisteredAccessibilityNeed {
  readonly fanName: string;
  readonly section: string;
  readonly row: string;
  readonly need: AccessibilityNeed;
  readonly registeredAt: string;
}

const ACCESS_NEED_LABELS: Record<AccessibilityNeed, string> = {
  wheelchair_routing:  "Wheelchair Routing — ensure aisle and ramp access",
  visual_impairment:   "Visual Impairment — verbal guidance and tactile assistance required",
  hearing_impairment:  "Hearing Impairment — visual alerts and written communication preferred",
};

interface UseAccessibilityNeedsReturn {
  registeredNeeds: RegisteredAccessibilityNeed[];
  registerNeed: (needs: AccessibilityNeed[]) => void;
  getNeedLabel: (need: AccessibilityNeed) => string;
  clearNeeds: () => void;
}

export function useAccessibilityNeeds(): UseAccessibilityNeedsReturn {
  const [registeredNeeds, setRegisteredNeeds] = useState<RegisteredAccessibilityNeed[]>([]);

  const registerNeed = useCallback((needs: AccessibilityNeed[]): void => {
    const now = new Date().toISOString();
    const newNeeds: RegisteredAccessibilityNeed[] = needs.map((need) => ({
      fanName: "Carlos Mendes",
      section: "212",
      row: "12",
      need,
      registeredAt: now,
    }));
    setRegisteredNeeds(newNeeds);
  }, []);

  const getNeedLabel = useCallback((need: AccessibilityNeed): string => {
    return ACCESS_NEED_LABELS[need];
  }, []);

  const clearNeeds = useCallback((): void => {
    setRegisteredNeeds([]);
  }, []);

  return { registeredNeeds, registerNeed, getNeedLabel, clearNeeds };
}
