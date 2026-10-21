import { Router } from "express";
import { getTodayReport } from "../controllers/reportsController";

const router = Router();

router.get("/today", getTodayReport);

export default router;
