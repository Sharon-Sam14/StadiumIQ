import type { EcoBalance, EcoAction, EcoTransaction } from "@/types/fan";
import { generateId } from "./formatters";

// ============================================================
// ECO POINTS REDUCER — Pure reducer, no side effects
// ============================================================

const XP_PER_POINT_RATIO = 2;
const MINIMUM_BALANCE = 0;

export const initialEcoBalance: EcoBalance = {
  ecoPoints: 240,
  fanXP: 480,
  level: 1,
  transactions: [],
  badges: [],
  completedMissions: [],
};

export function ecoReducer(state: EcoBalance, action: EcoAction): EcoBalance {
  switch (action.type) {
    case "ADD_POINTS": {
      const { points, xp, transactionType } = action.payload;
      const transaction: EcoTransaction = {
        id: generateId("txn"),
        type: transactionType,
        points,
        timestamp: new Date().toISOString(),
      };
      const newPoints = state.ecoPoints + points;
      const newXP = state.fanXP + xp;
      return {
        ...state,
        ecoPoints: newPoints,
        fanXP: newXP,
        level: calcLevel(newXP),
        transactions: [transaction, ...state.transactions].slice(0, 50),
      };
    }

    case "SPEND_POINTS": {
      const { points } = action.payload;
      const newBalance = state.ecoPoints - points;
      // Prevent negative balance
      if (newBalance < MINIMUM_BALANCE) return state;
      return {
        ...state,
        ecoPoints: newBalance,
      };
    }

    case "COMPLETE_MISSION": {
      const { missionId } = action.payload;
      if (state.completedMissions.includes(missionId)) return state;
      return {
        ...state,
        completedMissions: [...state.completedMissions, missionId],
      };
    }

    case "EARN_BADGE": {
      const already = state.badges.some((b) => b.id === action.payload.id);
      if (already) return state;
      return {
        ...state,
        badges: [...state.badges, action.payload],
      };
    }

    default:
      return state;
  }
}

function calcLevel(xp: number): number {
  if (xp >= 1000) return 4;
  if (xp >= 500) return 3;
  if (xp >= 200) return 2;
  return 1;
}

/**
 * Helper: returns points earned per action type.
 */
export const ECO_POINTS_TABLE: Record<
  EcoTransaction["type"],
  { points: number; xp: number }
> = {
  transit: { points: 30, xp: 30 * XP_PER_POINT_RATIO },
  recycling: { points: 50, xp: 50 * XP_PER_POINT_RATIO },
  water_refill: { points: 15, xp: 15 * XP_PER_POINT_RATIO },
  sponsor_booth: { points: 20, xp: 20 * XP_PER_POINT_RATIO },
};
