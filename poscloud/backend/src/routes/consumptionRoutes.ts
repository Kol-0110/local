import { Router } from "express";
import { getConsumption, saveConsumption, syncAll } from "../controllers/consumptionController";

const router = Router();

router.get("/", getConsumption);
router.post("/", saveConsumption);
router.post("/sync-all", syncAll);

export default router;
