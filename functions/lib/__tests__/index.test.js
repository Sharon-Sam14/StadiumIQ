"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
// 1. Mock firebase-admin inside hoisted closure, attaching FieldValue directly to the firestore function object
vitest_1.vi.mock("firebase-admin", () => {
    const mockBatchCommit = vitest_1.vi.fn();
    const mockBatchSet = vitest_1.vi.fn();
    const mockBatch = vitest_1.vi.fn(() => ({
        set: mockBatchSet,
        commit: mockBatchCommit
    }));
    const mockDocUpdate = vitest_1.vi.fn();
    const mockDocSet = vitest_1.vi.fn();
    const mockDocGet = vitest_1.vi.fn(() => ({
        exists: true,
        data: () => ({ pointCost: 80 })
    }));
    const mockDoc = vitest_1.vi.fn(() => ({
        get: mockDocGet,
        update: mockDocUpdate,
        set: mockDocSet
    }));
    const mockCollectionGet = vitest_1.vi.fn(() => ({
        docs: [
            { id: "inc-1", data: () => ({ type: "medical", severity: "high", status: "active" }) },
            { id: "inc-2", data: () => ({ type: "security", severity: "low", status: "resolved" }) }
        ]
    }));
    const mockCollection = vitest_1.vi.fn(() => ({
        doc: mockDoc,
        get: mockCollectionGet
    }));
    const mockDb = {
        batch: mockBatch,
        collection: mockCollection
    };
    const firestoreFn = () => mockDb;
    firestoreFn.FieldValue = {
        serverTimestamp: () => "mock-timestamp"
    };
    return {
        initializeApp: vitest_1.vi.fn(),
        firestore: firestoreFn
    };
});
// 2. Mock google-generative-ai
vitest_1.vi.mock("@google/generative-ai", () => {
    const mockGenerateContent = vitest_1.vi.fn(() => ({
        response: {
            text: () => "Hello! This is a mock Gemini AI response context."
        }
    }));
    const mockGetGenerativeModel = vitest_1.vi.fn(() => ({
        generateContent: mockGenerateContent
    }));
    return {
        GoogleGenerativeAI: vitest_1.vi.fn().mockImplementation(() => ({
            getGenerativeModel: mockGetGenerativeModel
        }))
    };
});
// 3. Mock firebase-functions v2 triggers
vitest_1.vi.mock("firebase-functions/v2/https", () => ({
    onRequest: (handler) => handler,
    onCall: (handler) => handler,
    HttpsError: class HttpsError extends Error {
        code;
        constructor(code, message) {
            super(message);
            this.code = code;
        }
    }
}));
const index_1 = require("../index");
(0, vitest_1.describe)("Firebase Cloud Functions Test Suite", () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.describe)("seedFirestore HTTPS Trigger", () => {
        (0, vitest_1.it)("should successfully batch write default matches and user profiles", async () => {
            const mockReq = { method: "GET" };
            const mockRes = {
                set: vitest_1.vi.fn(),
                status: vitest_1.vi.fn().mockReturnThis(),
                json: vitest_1.vi.fn()
            };
            await (0, index_1.seedFirestore)(mockReq, mockRes);
            (0, vitest_1.expect)(mockRes.status).toHaveBeenCalledWith(200);
            (0, vitest_1.expect)(mockRes.json).toHaveBeenCalledWith(vitest_1.expect.objectContaining({ success: true }));
        });
    });
    (0, vitest_1.describe)("aiConcierge Callable Function", () => {
        (0, vitest_1.it)("should call Gemini SDK model generation when api key is provided", async () => {
            process.env.GEMINI_API_KEY = "mock-key-ai";
            const request = {
                data: {
                    prompt: "What is the bag policy for the stadium?",
                    sessionId: "test-sess"
                }
            };
            const result = await index_1.aiConcierge(request);
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.text).toContain("Gemini AI response");
        });
        (0, vitest_1.it)("should throw validation error if prompt parameter is missing", async () => {
            const request = { data: {} };
            await (0, vitest_1.expect)(index_1.aiConcierge(request)).rejects.toThrow("The function must be called with a prompt string.");
        });
    });
    (0, vitest_1.describe)("getVolunteerAnalytics Callable Function", () => {
        (0, vitest_1.it)("should query incidents collection and return structured type/severity metrics", async () => {
            const result = await index_1.getVolunteerAnalytics({});
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.data.totalActive).toBe(1);
            (0, vitest_1.expect)(result.data.types.medical).toBe(1);
            (0, vitest_1.expect)(result.data.statuses.resolved).toBe(1);
        });
    });
    (0, vitest_1.describe)("autonomicConcessionOptimiser Callable Function", () => {
        (0, vitest_1.it)("should update Organic Hotdog price cost to 40 points on overstock alerts", async () => {
            const request = { data: { overstockAlert: true } };
            const result = await index_1.autonomicConcessionOptimiser(request);
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.pointCost).toBe(40);
        });
    });
});
//# sourceMappingURL=index.test.js.map