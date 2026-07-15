import { useState, useEffect, useCallback } from "react";
import { doc, onSnapshot, updateDoc, increment, arrayUnion } from "firebase/firestore";
import { db } from "@/utils/firebase";
import type { EcoBalance, EcoTransaction, EcoAction } from "@/types/fan";

export interface UseEcoPointsReturn {
  balance: EcoBalance;
  addPoints: (transactionType: EcoTransaction["type"]) => void;
  spendPoints: (points: number, itemId: string) => boolean;
  completeMission: (missionId: string) => void;
  dispatch: React.Dispatch<EcoAction>;
}

// Map transaction type to points and xp values
const ECO_POINTS_TABLE: Record<EcoTransaction["type"], { points: number; xp: number }> = {
  transit:       { points: 30, xp: 60 },
  recycling:     { points: 50, xp: 100 },
  water_refill:  { points: 15, xp: 30 },
  sponsor_booth: { points: 40, xp: 80 },
};

export function useEcoPoints(): UseEcoPointsReturn {
  const userId = "auth0-fan-priya-789"; // Default logged-in user profile id
  const [balance, setBalance] = useState<EcoBalance>({
    ecoPoints: 0,
    fanXP: 0,
    level: 1,
    transactions: [],
    badges: [],
    completedMissions: []
  });

  // Real-time listener for the user's leaderboard scores and eco balance profile
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "leaderboards", userId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setBalance(prev => ({
          ...prev,
          ecoPoints: data.ecoPoints || 0,
          fanXP: data.xpPoints || 0,
          level: Math.floor((data.xpPoints || 0) / 100) + 1,
          completedMissions: data.completedMissions || [],
          transactions: data.transactions || []
        }));
      }
    });
    return () => unsub();
  }, [userId]);

  const addPoints = useCallback(async (transactionType: EcoTransaction["type"]): Promise<void> => {
    const { points, xp } = ECO_POINTS_TABLE[transactionType];
    const userDocRef = doc(db, "leaderboards", userId);
    
    const newTx: EcoTransaction = {
      id: `tx-${Math.random().toString(36).slice(2, 9)}`,
      type: transactionType,
      points,
      timestamp: new Date().toISOString()
    };

    await updateDoc(userDocRef, {
      ecoPoints: increment(points),
      xpPoints: increment(xp),
      transactions: arrayUnion(newTx)
    });
  }, [userId]);

  const spendPoints = useCallback((points: number, _itemId: string): boolean => {
    if (balance.ecoPoints < points) return false;
    const userDocRef = doc(db, "leaderboards", userId);

    const newTx: EcoTransaction = {
      id: `tx-${Math.random().toString(36).slice(2, 9)}`,
      type: "recycling", // Treat spend as eco redemption
      points: -points,
      timestamp: new Date().toISOString()
    };

    updateDoc(userDocRef, {
      ecoPoints: increment(-points),
      transactions: arrayUnion(newTx)
    }).catch(console.error);

    return true;
  }, [balance.ecoPoints, userId]);

  const completeMission = useCallback(async (missionId: string): Promise<void> => {
    const userDocRef = doc(db, "leaderboards", userId);
    await updateDoc(userDocRef, {
      completedMissions: arrayUnion(missionId)
    });
  }, [userId]);

  const dispatch = useCallback((_action: EcoAction) => {
    // Reducer dispatch is fully superseded by Firestore updates
  }, []);

  return { balance, addPoints, spendPoints, completeMission, dispatch };
}
