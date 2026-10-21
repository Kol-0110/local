import { Router } from "express";
import { getWaiters, createWaiter } from "../controllers/waitersController";

const router = Router();

router.get("/", getWaiters);
router.post("/", createWaiter);

export default router;
