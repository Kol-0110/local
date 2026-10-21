import { Router } from "express";
import {
  startPayment,
  relayOtp,
  confirmPayment,
  getPaymentAttempt,
} from "../controllers/paymentsController";

const router = Router();

router.post("/start", startPayment);
router.post("/otp", relayOtp);
router.post("/confirm", confirmPayment);
router.get("/:orderId", getPaymentAttempt);

export default router;
