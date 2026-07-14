import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { FLOATING_BALLS_COUNT, PULSE_THRESHOLDS } from "@/utils/animationConstants";
import { useAnimationTrigger } from "@/hooks/useAnimationTrigger";

// ============================================================
// FOOTBALL ANIMATIONS UNIT TESTS
// ============================================================

describe("Football Animations Constants", () => {
  it("has exactly 6 floating balls defined in onboarding hero configuration", () => {
    expect(FLOATING_BALLS_COUNT).toBe(6);
  });

  it("defines the correct pulse ring thresholds (70% warning, 90% critical)", () => {
    expect(PULSE_THRESHOLDS.WARNING).toBe(70);
    expect(PULSE_THRESHOLDS.CRITICAL).toBe(90);
  });
});

describe("useAnimationTrigger — Goal Celebration lifecycle", () => {
  it("initializes triggered state to false", () => {
    const { result } = renderHook(() => useAnimationTrigger());
    expect(result.current.isTriggered).toBe(false);
  });

  it("sets triggered state to true when called, and resets after delay", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useAnimationTrigger(800));

    act(() => {
      result.current.trigger();
    });
    expect(result.current.isTriggered).toBe(true);

    act(() => {
      vi.advanceTimersByTime(800);
    });
    expect(result.current.isTriggered).toBe(false);

    vi.useRealTimers();
  });

  it("can be manually reset immediately", () => {
    const { result } = renderHook(() => useAnimationTrigger(1000));

    act(() => {
      result.current.trigger();
    });
    expect(result.current.isTriggered).toBe(true);

    act(() => {
      result.current.reset();
    });
    expect(result.current.isTriggered).toBe(false);
  });
});
