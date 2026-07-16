// ============================================================
// FAN TYPES
// ============================================================

export type UserRole = "fan" | "organizer" | "volunteer" | null;

export type Language = "en" | "ar" | "fr" | "es" | "pt";

export type AccessibilityNeed =
  "wheelchair_routing" | "visual_impairment" | "hearing_impairment";

export type WasteCategory =
  "recyclable" | "metal" | "paper" | "compost" | "general";

export interface WasteClassification {
  readonly category: WasteCategory;
  readonly binLabel: string;
  readonly binColor: string;
  readonly instruction: string;
  readonly ecoNote: string;
}

export interface FanProfile {
  readonly name: string;
  readonly matchId: string;
  readonly section: string;
  readonly row: string;
  readonly seat: string;
  readonly gate: string;
  preferredLanguage: Language;
  accessibilityNeeds: AccessibilityNeed[];
}

export interface EcoTransaction {
  readonly id: string;
  readonly type: "transit" | "recycling" | "water_refill" | "sponsor_booth";
  readonly points: number;
  readonly timestamp: string;
}

export interface EcoBadge {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly earnedAt: string;
}

export interface EcoBalance {
  ecoPoints: number;
  fanXP: number;
  level: number;
  transactions: EcoTransaction[];
  badges: EcoBadge[];
  completedMissions: string[];
}

export type EcoAction =
  | {
      type: "ADD_POINTS";
      payload: {
        points: number;
        xp: number;
        transactionType: EcoTransaction["type"];
      };
    }
  | { type: "SPEND_POINTS"; payload: { points: number; itemId: string } }
  | { type: "COMPLETE_MISSION"; payload: { missionId: string } }
  | { type: "EARN_BADGE"; payload: EcoBadge };

export interface EcoMission {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly points: number;
}

export interface EcoReward {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly pointCost: number;
}

export interface LeaderboardEntry {
  readonly rank: number;
  readonly name: string;
  readonly ecoPoints: number;
  readonly fanXP: number;
  readonly country: string;
}

export interface VendorQueueInfo {
  readonly vendorId: string;
  readonly name: string;
  readonly zone: string;
  readonly estimatedWaitMinutes: number;
  readonly bestTimeNote: string;
}

export interface TransportRoute {
  readonly id: string;
  readonly rank: number;
  readonly exitGate: string;
  readonly gateWaitMinutes: number;
  readonly mode: string;
  readonly destination: string;
  readonly estimatedMinutes: number;
  readonly summary: string;
}

export interface ChatMessage {
  readonly id: string;
  readonly role: "user" | "assistant";
  readonly text: string;
  readonly language: Language;
  readonly timestamp: string;
}

export interface SustainabilityMetrics {
  wasteSavedKg: number;
  carbonOffsetKg: number;
  waterRefills: number;
  transitCheckins: number;
}
