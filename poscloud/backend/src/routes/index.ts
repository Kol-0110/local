import { Router } from "express";
import ordersRoutes from "./ordersRoutes";
import waitersRoutes from "./waitersRoutes";
import reportsRoutes from "./reportsRoutes";
import statusRoutes from "./statusRoutes";
import consumptionRoutes from "./consumptionRoutes";

const router = Router();

router.use("/orders", ordersRoutes);
router.use("/waiters", waitersRoutes);
router.use("/reports", reportsRoutes);
router.use("/status", statusRoutes);
router.use("/consumption", consumptionRoutes);

export default router;
