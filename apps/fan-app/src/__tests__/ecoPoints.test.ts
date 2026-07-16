import { describe, it, expect } from "vitest";
import {
  ecoReducer,
  initialEcoBalance,
  ECO_POINTS_TABLE,
} from "@/utils/ecoReducer";
import type { EcoBalance } from "@/types/fan";

// ============================================================
// ECO POINTS REDUCER UNIT TESTS
// ============================================================

describe("ecoReducer — ADD_POINTS", () => {
  it("adds correct eco points from the points table", () => {
    const state = ecoReducer(initialEcoBalance, {
      type: "ADD_POINTS",
      payload: { points: 50, xp: 100, transactionType: "recycling" },
    });
    expect(state.ecoPoints).toBe(initialEcoBalance.ecoPoints + 50);
  });

  it("adds correct XP", () => {
    const state = ecoReducer(initialEcoBalance, {
      type: "ADD_POINTS",
      payload: { points: 30, xp: 60, transactionType: "transit" },
    });
    expect(state.fanXP).toBe(initialEcoBalance.fanXP + 60);
  });

  it("adds a transaction to the transaction log", () => {
    const state = ecoReducer(initialEcoBalance, {
      type: "ADD_POINTS",
      payload: { points: 15, xp: 30, transactionType: "water_refill" },
    });
    expect(state.transactions).toHaveLength(
      initialEcoBalance.transactions.length + 1,
    );
    expect(state.transactions[0].type).toBe("water_refill");
    expect(state.transactions[0].points).toBe(15);
  });

  it("limits transaction log to 50 entries", () => {
    let state = { ...initialEcoBalance };
    for (let i = 0; i < 55; i++) {
      state = ecoReducer(state, {
        type: "ADD_POINTS",
        payload: { points: 10, xp: 20, transactionType: "transit" },
      });
    }
    expect(state.transactions).toHaveLength(50);
  });
});

describe("ecoReducer — SPEND_POINTS", () => {
  it("deducts points when balance is sufficient", () => {
    const state = ecoReducer(initialEcoBalance, {
      type: "SPEND_POINTS",
      payload: { points: 80, itemId: "r1" },
    });
    expect(state.ecoPoints).toBe(initialEcoBalance.ecoPoints - 80);
  });

  it("does NOT deduct points when balance is insufficient (prevents negative)", () => {
    const poorState: EcoBalance = { ...initialEcoBalance, ecoPoints: 10 };
    const state = ecoReducer(poorState, {
      type: "SPEND_POINTS",
      payload: { points: 200, itemId: "r4" },
    });
    // Balance should remain unchanged
    expect(state.ecoPoints).toBe(10);
  });

  it("does not go below 0", () => {
    const poorState: EcoBalance = { ...initialEcoBalance, ecoPoints: 0 };
    const state = ecoReducer(poorState, {
      type: "SPEND_POINTS",
      payload: { points: 100, itemId: "r1" },
    });
    expect(state.ecoPoints).toBeGreaterThanOrEqual(0);
  });
});

describe("ecoReducer — COMPLETE_MISSION", () => {
  it("adds mission id to completedMissions", () => {
    const state = ecoReducer(initialEcoBalance, {
      type: "COMPLETE_MISSION",
      payload: { missionId: "mission-1" },
    });
    expect(state.completedMissions).toContain("mission-1");
  });

  it("does not add duplicate mission completions", () => {
    let state = ecoReducer(initialEcoBalance, {
      type: "COMPLETE_MISSION",
      payload: { missionId: "mission-1" },
    });
    state = ecoReducer(state, {
      type: "COMPLETE_MISSION",
      payload: { missionId: "mission-1" },
    });
    const count = state.completedMissions.filter(
      (id) => id === "mission-1",
    ).length;
    expect(count).toBe(1);
  });
});

describe("ecoReducer — EARN_BADGE", () => {
  it("adds a badge to badges list", () => {
    const badge = {
      id: "badge-green-1",
      title: "Green Guardian",
      description: "Recycled 5 items",
      earnedAt: new Date().toISOString(),
    };
    const state = ecoReducer(initialEcoBalance, {
      type: "EARN_BADGE",
      payload: badge,
    });
    expect(state.badges).toHaveLength(1);
    expect(state.badges[0].id).toBe("badge-green-1");
  });

  it("does not add duplicate badges", () => {
    const badge = {
      id: "badge-dup",
      title: "Duplicate",
      description: "test",
      earnedAt: new Date().toISOString(),
    };
    let state = ecoReducer(initialEcoBalance, {
      type: "EARN_BADGE",
      payload: badge,
    });
    state = ecoReducer(state, { type: "EARN_BADGE", payload: badge });
    expect(state.badges).toHaveLength(1);
  });
});

describe("ECO_POINTS_TABLE", () => {
  it("contains entries for all transaction types", () => {
    const types: Array<keyof typeof ECO_POINTS_TABLE> = [
      "transit",
      "recycling",
      "water_refill",
      "sponsor_booth",
    ];
    types.forEach((type) => {
      expect(ECO_POINTS_TABLE[type]).toBeDefined();
      expect(ECO_POINTS_TABLE[type].points).toBeGreaterThan(0);
      expect(ECO_POINTS_TABLE[type].xp).toBeGreaterThan(0);
    });
  });
});
