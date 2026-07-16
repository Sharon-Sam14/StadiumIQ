import { describe, it, expect } from "vitest";
import {
  classifyWaste,
  hasRecognizedWasteKeyword,
} from "@/utils/wasteClassifier";

// ============================================================
// WASTE CLASSIFIER UNIT TESTS
// ============================================================

describe("classifyWaste()", () => {
  it("classifies plastic bottle as recyclable", () => {
    expect(classifyWaste("plastic bottle").category).toBe("recyclable");
  });

  it("classifies soda can as metal", () => {
    expect(classifyWaste("soda can").category).toBe("metal");
  });

  it("classifies aluminum can as metal", () => {
    expect(classifyWaste("aluminum can").category).toBe("metal");
  });

  it("classifies cardboard as paper", () => {
    expect(classifyWaste("cardboard box").category).toBe("paper");
  });

  it("classifies food scraps as compost", () => {
    expect(classifyWaste("food waste").category).toBe("compost");
  });

  it("classifies banana peel as compost", () => {
    expect(classifyWaste("banana peel").category).toBe("compost");
  });

  it("classifies unrecognized input as general waste", () => {
    expect(classifyWaste("broken glass shard").category).toBe("general");
  });

  it("is case-insensitive", () => {
    expect(classifyWaste("PLASTIC CUP").category).toBe("recyclable");
    expect(classifyWaste("Soda Can").category).toBe("metal");
  });

  it("returns a bin label for all categories", () => {
    const inputs = ["plastic", "can", "paper", "food", "unknown item xyz"];
    inputs.forEach((input) => {
      const result = classifyWaste(input);
      expect(typeof result.binLabel).toBe("string");
      expect(result.binLabel.length).toBeGreaterThan(0);
    });
  });

  it("returns an eco note for all categories", () => {
    const inputs = ["plastic", "can", "paper", "food", "unknown item xyz"];
    inputs.forEach((input) => {
      const result = classifyWaste(input);
      expect(typeof result.ecoNote).toBe("string");
      expect(result.ecoNote.length).toBeGreaterThan(0);
    });
  });

  it("trims leading/trailing whitespace before matching", () => {
    expect(classifyWaste("  plastic bottle  ").category).toBe("recyclable");
  });
});

describe("hasRecognizedWasteKeyword()", () => {
  it("returns true for recognized keywords", () => {
    expect(hasRecognizedWasteKeyword("plastic bottle")).toBe(true);
    expect(hasRecognizedWasteKeyword("soda can")).toBe(true);
    expect(hasRecognizedWasteKeyword("food scraps")).toBe(true);
  });

  it("returns false for unrecognized words", () => {
    expect(hasRecognizedWasteKeyword("random stuff xyz")).toBe(false);
    expect(hasRecognizedWasteKeyword("")).toBe(false);
  });
});
