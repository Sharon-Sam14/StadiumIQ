import { useReducer, useCallback } from "react";
import { ecoReducer, initialEcoBalance, ECO_POINTS_TABLE } from "@/utils/ecoReducer";
import type { EcoBalance, EcoAction, EcoTransaction } from "@/types/fan";

// ============================================================
// USE ECO POINTS HOOK
// ============================================================

export interface UseEcoPointsReturn {
  balance: EcoBalance;
  addPoints: (transactionType: EcoTransaction["type"]) => void;
  spendPoints: (points: number, itemId: string) => boolean;
  completeMission: (missionId: string) => void;
  dispatch: React.Dispatch<EcoAction>;
}

export function useEcoPoints(): UseEcoPointsReturn {
  const [balance, dispatch] = useReducer(ecoReducer, initialEcoBalance);

  const addPoints = useCallback((transactionType: EcoTransaction["type"]): void => {
    const { points, xp } = ECO_POINTS_TABLE[transactionType];
    dispatch({ type: "ADD_POINTS", payload: { points, xp, transactionType } });
  }, []);

  const spendPoints = useCallback((points: number, itemId: string): boolean => {
    if (balance.ecoPoints < points) return false;
    dispatch({ type: "SPEND_POINTS", payload: { points, itemId } });
    return true;
  }, [balance.ecoPoints]);

  const completeMission = useCallback((missionId: string): void => {
    dispatch({ type: "COMPLETE_MISSION", payload: { missionId } });
  }, []);

  return { balance, addPoints, spendPoints, completeMission, dispatch };
}
