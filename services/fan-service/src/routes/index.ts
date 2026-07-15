import { Router } from "express";
import { FanController } from "../controllers/fan.controller";

const router = Router();
const fanController = new FanController();

router.get("/me", fanController.getProfile);
router.get("/tickets", fanController.getTickets);
router.post("/incidents", fanController.createIncident);

export default router;
