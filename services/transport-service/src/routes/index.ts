import { Router } from "express";
import { TransportController } from "../controllers/transport.controller";

const router = Router();
const c = new TransportController();

router.get("/", c.getTransitInfo);

export default router;
