import type { WasteCategory, WasteClassification } from "@/types/fan";

// ============================================================
// WASTE CLASSIFIER — Keyword-to-Category Map
// Explicitly structured as a typed map (not a giant if/else chain).
// ============================================================

interface KeywordCategory {
  readonly category: WasteCategory;
  readonly keywords: readonly string[];
}

/**
 * Ordered keyword-to-category mapping.
 * Rules are checked from top to bottom — first match wins.
 */
const WASTE_KEYWORD_MAP: readonly KeywordCategory[] = [
  {
    category: "recyclable",
    keywords: [
      "plastic", "bottle", "cup", "pet", "container", "wrapper",
      "polystyrene", "foam", "straw", "bag", "packaging",
    ],
  },
  {
    category: "metal",
    keywords: [
      "can", "tin", "aluminum", "aluminium", "soda", "beer",
      "metal", "foil", "bottle cap",
    ],
  },
  {
    category: "paper",
    keywords: [
      "paper", "cardboard", "box", "newspaper", "magazine",
      "carton", "receipt", "napkin", "tissue", "flyer",
    ],
  },
  {
    category: "compost",
    keywords: [
      "food", "organic", "apple", "banana", "hotdog", "sandwich",
      "fruit", "vegetable", "peel", "core", "leftovers", "waste",
    ],
  },
] as const;

/**
 * Maps waste category to bin display information.
 */
const BIN_INFO: Record<WasteCategory, Omit<WasteClassification, "category">> = {
  recyclable: {
    binLabel: "Green Recycling Bin",
    binColor: "#10B981",
    instruction:
      "Place in the GREEN recycling bin. Look for the triangle symbol. Earn +50 Eco Points when you scan the bin QR code.",
    ecoNote:
      "Recycling one plastic bottle saves enough energy to power a phone for 25 hours.",
  },
  metal: {
    binLabel: "Silver Metals Bin",
    binColor: "#94A3B8",
    instruction:
      "Place in the SILVER metals bin. Aluminium cans are 100% recyclable. Earn +50 Eco Points on bin scan.",
    ecoNote:
      "Recycling aluminium uses 95% less energy than producing it from raw ore.",
  },
  paper: {
    binLabel: "Blue Paper Bin",
    binColor: "#3B82F6",
    instruction:
      "Place in the BLUE paper/cardboard bin. Flatten boxes before depositing. Earn +30 Eco Points on scan.",
    ecoNote:
      "Recycling one ton of paper saves 17 trees and 7,000 gallons of water.",
  },
  compost: {
    binLabel: "Brown Compost Bin",
    binColor: "#92400E",
    instruction:
      "Place in the BROWN organic/compost bin. Compostable food scraps reduce landfill methane emissions significantly.",
    ecoNote:
      "Composting one ton of food waste prevents about 300 kg of CO₂ equivalent emissions.",
  },
  general: {
    binLabel: "Black General Waste Bin",
    binColor: "#374151",
    instruction:
      "Place in the BLACK general waste bin. This item does not appear to be recyclable at this venue.",
    ecoNote:
      "Try to reduce single-use items where possible to lower your environmental footprint.",
  },
};

/**
 * Classifies a user-described waste item into the appropriate bin category.
 * Uses explicit keyword matching (not an if/else chain) for traceability.
 *
 * @param input - Raw user description (e.g. "plastic bottle", "soda can")
 * @returns WasteClassification with bin info and eco tip
 */
export function classifyWaste(input: string): WasteClassification {
  const normalizedInput = input.toLowerCase().trim();

  for (const { category, keywords } of WASTE_KEYWORD_MAP) {
    for (const keyword of keywords) {
      if (normalizedInput.includes(keyword)) {
        return { category, ...BIN_INFO[category] };
      }
    }
  }

  return { category: "general", ...BIN_INFO["general"] };
}

/**
 * Returns true if the given string contains any waste-related keyword.
 * Useful for enabling/disabling the classify button.
 */
export function hasRecognizedWasteKeyword(input: string): boolean {
  const normalized = input.toLowerCase().trim();
  return WASTE_KEYWORD_MAP.some(({ keywords }) =>
    keywords.some((kw) => normalized.includes(kw))
  );
}
