import { onRequest, onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { GoogleGenerativeAI } from "@google/generative-ai";

admin.initializeApp();
const db = admin.firestore();

/**
 * HTTP endpoint that seeds the Cloud Firestore database with initial mock fixtures
 * including venues, matches, default users, sustainability challenges, rewards, and tickets.
 */
export const seedFirestore = onRequest(async (req, res) => {
  // Access control
  res.set("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    res.status(204).send("");
    return;
  }

  try {
    const batch = db.batch();

    // Seed Venues
    const venueRef = db.collection("venues").doc("metlife-stadium-id");
    batch.set(venueRef, {
      name: "MetLife Stadium",
      city: "East Rutherford",
      country: "US",
      capacity: 82500,
      latitude: 40.8136,
      longitude: -74.0744,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Seed Matches
    const matchRef = db.collection("matches").doc("match-82-id");
    batch.set(matchRef, {
      venueId: "metlife-stadium-id",
      homeTeam: "Argentina",
      awayTeam: "France",
      kickoffTime: "2026-07-15T20:00:00Z",
      status: "scheduled",
      attendance: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Seed Default Users
    const users = [
      {
        uid: "auth0-fan-priya-789",
        email: "priya.sharma@fan.worldcup.com",
        fullName: "Priya Sharma",
        role: "fan",
        preferredLang: "en",
        accessibilityNeeds: { wheelchairRequired: true },
        dietaryPrefs: [],
      },
      {
        uid: "auth0-volunteer-jake-456",
        email: "jake@stadiumiq.com",
        fullName: "Jake Whitmore",
        role: "volunteer",
        preferredLang: "en",
        accessibilityNeeds: {},
        dietaryPrefs: [],
      },
    ];

    for (const u of users) {
      const uRef = db.collection("users").doc(u.uid);
      batch.set(uRef, {
        email: u.email,
        fullName: u.fullName,
        role: u.role,
        preferredLang: u.preferredLang,
        accessibilityNeeds: u.accessibilityNeeds,
        dietaryPrefs: u.dietaryPrefs,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Initialize Leaderboards entry
      const lbRef = db.collection("leaderboards").doc(u.uid);
      batch.set(lbRef, {
        userId: u.uid,
        userName: u.fullName,
        xpPoints: u.role === "fan" ? 120 : 240,
        ecoPoints: u.role === "fan" ? 60 : 120,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // Seed Sustainability Challenges
    const challenges = [
      {
        id: "c1",
        title: "Public Transit Commuter",
        description: "Use the subway or shuttle bus.",
        pointsValue: 30,
        xpValue: 60,
        type: "DAILY",
        targetCount: 1,
      },
      {
        id: "c2",
        title: "Smart Waste sorting",
        description: "Recycle 2 items at smart recycling bins.",
        pointsValue: 50,
        xpValue: 100,
        type: "MISSION",
        targetCount: 2,
      },
    ];
    for (const c of challenges) {
      const cRef = db.collection("challenges").doc(c.id);
      batch.set(cRef, {
        ...c,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // Seed Rewards Catalog
    const rewards = [
      {
        id: "r1",
        title: "Free Organic Concession Hotdog",
        description: "Redeem at Section 112 Concessions.",
        pointCost: 80,
        stock: 150,
        code: "REW-HDOG-982",
      },
      {
        id: "r2",
        title: "20% Off Merchandise Voucher",
        description: "20% off at any official FIFA store.",
        pointCost: 150,
        stock: 100,
        code: "REW-MERCH-813",
      },
    ];
    for (const r of rewards) {
      const rRef = db.collection("rewards").doc(r.id);
      batch.set(rRef, {
        ...r,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // Seed Tickets
    const ticketRef = db.collection("tickets").doc("ticket-101-id");
    batch.set(ticketRef, {
      fanId: "auth0-fan-priya-789",
      matchId: "match-82-id",
      seatSection: "212",
      seatRow: "D",
      seatNumber: "14",
      gate: "Gate B",
      qrCode: "SIQ-FIFA2026-M82-SEC212",
      isAccessible: true,
      isUsed: false,
      usedAt: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await batch.commit();
    res.status(200).json({
      success: true,
      message: "Firestore database successfully seeded!",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, error: message });
  }
});

/**
 * Callable function that queries the Gemini 1.5 Flash model with custom stadium operational context.
 * Resolves query guidelines regarding prohibited items, transportation, and accessibility.
 *
 * @param request.data.prompt - The query string from the user.
 * @param request.data.sessionId - The active session identifier.
 */
export const aiConcierge = onCall(async (request) => {
  const { prompt, sessionId } = request.data;
  if (!prompt) {
    throw new HttpsError(
      "invalid-argument",
      "The function must be called with a prompt string.",
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new HttpsError(
      "failed-precondition",
      "Gemini API key is not configured on the backend environment.",
    );
  }

  try {
    const ai = new GoogleGenerativeAI(apiKey);
    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Custom StadiumIQ RAG knowledge-base fallback context
    const fallbackRules = `
      You are the StadiumIQ AI Concierge for FIFA World Cup 2026.
      Here are the operational rules:
      - Bag Policy: Clear plastic, vinyl, or PVC bags not exceeding 12" x 6" x 12".
      - Prohibited items: Weapons, bottles, whistles, umbrellas, professional cameras.
      - Transportation: Fans are urged to take the transit trains from Secaucus Junction or shuttle lines.
      - Accessibility services: Elevated ramps are available at Gate A and Gate B. Lift keys can be requested from yellow-vested volunteers.
    `;

    const fullPrompt = `
      Context: ${fallbackRules}
      Conversation Session ID: ${sessionId || "session-default"}
      User Query: ${prompt}
    `;

    const response = await model.generateContent(fullPrompt);
    const text = response.response.text();

    return { success: true, text };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new HttpsError("internal", message);
  }
});

/**
 * Callable function that aggregates volunteer reports / incidents by type, severity, and status.
 * Calculates total active incidents.
 */
export const getVolunteerAnalytics = onCall(async () => {
  try {
    const querySnapshot = await db.collection("incidents").get();
    const incidents = querySnapshot.docs.map((doc) => doc.data());

    // Aggregate by type, severity, and status
    const types: Record<string, number> = {};
    const severities: Record<string, number> = {};
    const statuses: Record<string, number> = {};

    incidents.forEach((inc) => {
      if (inc.type) {
        types[inc.type] = (types[inc.type] || 0) + 1;
      }
      if (inc.severity) {
        severities[inc.severity] = (severities[inc.severity] || 0) + 1;
      }
      if (inc.status) {
        statuses[inc.status] = (statuses[inc.status] || 0) + 1;
      }
    });

    return {
      success: true,
      data: {
        totalActive: incidents.filter((inc) => inc.status !== "resolved").length,
        types,
        severities,
        statuses,
      },
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new HttpsError("internal", message);
  }
});

/**
 * Callable function that updates concession rewards (like organic hotdog point costs)
 * dynamically based on surplus overstock alert status.
 *
 * @param request.data.overstockAlert - Boolean indicating if an overstock pricing model should trigger.
 */
export const autonomicConcessionOptimiser = onCall(async (request) => {
  const { overstockAlert } = request.data;
  try {
    const rewardsRef = db.collection("rewards");
    const hotdogSnap = await rewardsRef.doc("r1").get();

    if (!hotdogSnap.exists) {
      throw new HttpsError("not-found", "Organic Hotdog reward not found.");
    }

    const currentCost = overstockAlert ? 40 : 80;
    await rewardsRef.doc("r1").update({ pointCost: currentCost });

    // Emit live alert to the global system metrics
    await db
      .collection("sustainability_metrics")
      .doc("price_drop_state")
      .set({
        priceDropActive: !!overstockAlert,
        message: overstockAlert
          ? "AI PRICE_DROP Active: Section 112 organic hotdog points cost reduced by 50%!"
          : "Normal pricing",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    return { success: true, pointCost: currentCost };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new HttpsError("internal", message);
  }
});
