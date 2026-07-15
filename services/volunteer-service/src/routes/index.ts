import { Router } from "express";
import { VolunteerController } from "../controllers/volunteer.controller";

const router = Router();
const c = new VolunteerController();

// Volunteer shift management endpoints
router.get("/tasks", c.getTasks);
router.patch("/tasks/:id", c.updateTask);
router.get("/briefing", c.getBriefing);
router.post("/incidents", c.createIncident);
router.post("/broadcast", c.broadcastSafetyAlert);
router.get("/analytics", c.getAnalytics);

// Sustainability & Eco-Gamification endpoints
router.get("/sustainability/points/balance", c.getPointsBalance);
router.post("/sustainability/points/transaction", c.createPointsTransaction);
router.get("/sustainability/rewards", c.getRewards);
router.post("/sustainability/rewards/redeem", c.redeemReward);
router.get("/sustainability/challenges", c.getChallenges);
router.get("/sustainability/leaderboard", c.getLeaderboard);
router.get("/sustainability/metrics", c.getSustainabilityMetrics);
router.post("/sustainability/qr/validate", c.validateQr);
router.post("/sustainability/recycling/log", c.logRecycling);

export default router;
