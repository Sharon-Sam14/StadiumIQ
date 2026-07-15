import { describe, it, expect, vi, beforeEach } from "vitest";

// 1. Mock firebase-admin inside hoisted closure, attaching FieldValue directly to the firestore function object
vi.mock("firebase-admin", () => {
  const mockBatchCommit = vi.fn();
  const mockBatchSet = vi.fn();
  const mockBatch = vi.fn(() => ({
    set: mockBatchSet,
    commit: mockBatchCommit
  }));

  const mockDocUpdate = vi.fn();
  const mockDocSet = vi.fn();
  const mockDocGet = vi.fn(() => ({
    exists: true,
    data: () => ({ pointCost: 80 })
  }));

  const mockDoc = vi.fn(() => ({
    get: mockDocGet,
    update: mockDocUpdate,
    set: mockDocSet
  }));

  const mockCollectionGet = vi.fn(() => ({
    docs: [
      { id: "inc-1", data: () => ({ type: "medical", severity: "high", status: "active" }) },
      { id: "inc-2", data: () => ({ type: "security", severity: "low", status: "resolved" }) }
    ]
  }));

  const mockCollection = vi.fn(() => ({
    doc: mockDoc,
    get: mockCollectionGet
  }));

  const mockDb = {
    batch: mockBatch,
    collection: mockCollection
  };

  const firestoreFn: any = () => mockDb;
  firestoreFn.FieldValue = {
    serverTimestamp: () => "mock-timestamp"
  };

  return {
    initializeApp: vi.fn(),
    firestore: firestoreFn
  };
});

// 2. Mock google-generative-ai
vi.mock("@google/generative-ai", () => {
  const mockGenerateContent = vi.fn(() => ({
    response: {
      text: () => "Hello! This is a mock Gemini AI response context."
    }
  }));
  const mockGetGenerativeModel = vi.fn(() => ({
    generateContent: mockGenerateContent
  }));

  return {
    GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
      getGenerativeModel: mockGetGenerativeModel
    }))
  };
});

// 3. Mock firebase-functions v2 triggers
vi.mock("firebase-functions/v2/https", () => ({
  onRequest: (handler: any) => handler,
  onCall: (handler: any) => handler,
  HttpsError: class HttpsError extends Error {
    constructor(public code: string, message: string) {
      super(message);
    }
  }
}));

import { seedFirestore, aiConcierge, getVolunteerAnalytics, autonomicConcessionOptimiser } from "../index";

describe("Firebase Cloud Functions Test Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("seedFirestore HTTPS Trigger", () => {
    it("should successfully batch write default matches and user profiles", async () => {
      const mockReq = { method: "GET" } as any;
      const mockRes = {
        set: vi.fn(),
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      } as any;

      await seedFirestore(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });

  describe("aiConcierge Callable Function", () => {
    it("should call Gemini SDK model generation when api key is provided", async () => {
      process.env.GEMINI_API_KEY = "mock-key-ai";
      const request = {
        data: {
          prompt: "What is the bag policy for the stadium?",
          sessionId: "test-sess"
        }
      } as any;

      const result = await (aiConcierge as any)(request);
      expect(result.success).toBe(true);
      expect(result.text).toContain("Gemini AI response");
    });

    it("should throw validation error if prompt parameter is missing", async () => {
      const request = { data: {} } as any;
      await expect((aiConcierge as any)(request)).rejects.toThrow("The function must be called with a prompt string.");
    });
  });

  describe("getVolunteerAnalytics Callable Function", () => {
    it("should query incidents collection and return structured type/severity metrics", async () => {
      const result = await (getVolunteerAnalytics as any)({} as any);
      expect(result.success).toBe(true);
      expect(result.data.totalActive).toBe(1);
      expect(result.data.types.medical).toBe(1);
      expect(result.data.statuses.resolved).toBe(1);
    });
  });

  describe("autonomicConcessionOptimiser Callable Function", () => {
    it("should update Organic Hotdog price cost to 40 points on overstock alerts", async () => {
      const request = { data: { overstockAlert: true } } as any;

      const result = await (autonomicConcessionOptimiser as any)(request);
      expect(result.success).toBe(true);
      expect(result.pointCost).toBe(40);
    });
  });
});
