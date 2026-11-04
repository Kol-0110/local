import { Request, Response } from "express";
import { getDbOrders, saveDbOrder } from "../services/dbService";
import { OrderRecord, PaymentAttemptRecord } from "../models/types";

// In-memory payment attempts (also persist on order if you extend dbService)
const paymentAttempts: PaymentAttemptRecord[] = [];

function genId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Start payment for an order — does NOT mark paid yet */
export async function startPayment(req: Request, res: Response) {
  try {
    const { orderId, method, amount, provider, cashierId, cashierName } = req.body as {
      orderId: string;
      method: "CASH" | "ETHQR" | "USSD_PUSH" | "CARD";
      amount?: number;
      provider?: "telebirr" | "cbe" | "cash" | "ethqr";
      cashierId?: string;
      cashierName?: string;
    };

    if (!orderId || !method) {
      return res.status(400).json({ success: false, error: "orderId and method required" });
    }

    const orders = await getDbOrders();
    const order = orders.find((o) => o.id === orderId);
    if (!order) return res.status(404).json({ success: false, error: "Order not found" });
    if (order.paymentStatus === "PAID") {
      return res.status(400).json({ success: false, error: "Order already paid" });
    }

    const attempt: PaymentAttemptRecord = {
      id: genId("pay"),
      orderId: order.id,
      orderNumber: order.orderNumber,
      method,
      amount: amount ?? order.totalAmount,
      status: "pending",
      provider: provider || (method === "CASH" ? "cash" : method === "ETHQR" ? "ethqr" : "telebirr"),
      createdAt: new Date().toISOString(),
    };

    paymentAttempts.unshift(attempt);

    order.paymentStatus = "AWAITING_PAYMENT";
    order.paymentChannel = method;
    order.paymentProvider = attempt.provider || null;
    order.activePaymentAttemptId = attempt.id;
    if (cashierId) order.cashierId = cashierId;
    if (cashierName) order.cashierName = cashierName;

    await saveDbOrder(order);

    res.json({
      success: true,
      message: "Payment started — confirm only after real money arrives",
      attempt,
      order,
      billReference: order.orderNumber, // customer must use this
    });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
}

/** Waiter relays OTP to cashier for this order's active payment */
export async function relayOtp(req: Request, res: Response) {
  try {
    const { orderId, otpCode, waiterId } = req.body as {
      orderId: string;
      otpCode: string;
      waiterId?: string;
    };

    if (!orderId || !otpCode) {
      return res.status(400).json({ success: false, error: "orderId and otpCode required" });
    }

    const orders = await getDbOrders();
    const order = orders.find((o) => o.id === orderId);
    if (!order) return res.status(404).json({ success: false, error: "Order not found" });

    if (waiterId && order.waiterId !== waiterId) {
      return res.status(403).json({ success: false, error: "Only the order waiter can relay OTP" });
    }

    const attempt = paymentAttempts.find((a) => a.id === order.activePaymentAttemptId);
    if (!attempt || attempt.status !== "pending") {
      return res.status(400).json({ success: false, error: "No active pending payment for this order" });
    }

    attempt.otpCode = String(otpCode).trim();
    res.json({
      success: true,
      message: "OTP relayed to cashier. OTP is not payment proof — cashier must confirm merchant success.",
      orderId: order.id,
      orderNumber: order.orderNumber,
      otpCode: attempt.otpCode,
    });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
}

/**
 * Confirm payment ONLY after:
 * - Cash received, or
 * - Real QR/bank success, or
 * - Telebirr merchant success after OTP
 * Never from screenshot alone.
 */
export async function confirmPayment(req: Request, res: Response) {
  try {
    const {
      orderId,
      method,
      providerRef,
      confirmedBy,
      note,
    } = req.body as {
      orderId: string;
      method?: "CASH" | "ETHQR" | "USSD_PUSH" | "CARD";
      providerRef?: string;
      confirmedBy: string;
      note?: string;
    };

    if (!orderId || !confirmedBy) {
      return res.status(400).json({ success: false, error: "orderId and confirmedBy required" });
    }

    const orders = await getDbOrders();
    const order = orders.find((o) => o.id === orderId);
    if (!order) return res.status(404).json({ success: false, error: "Order not found" });
    if (order.paymentStatus === "PAID") {
      return res.json({ success: true, message: "Already paid", order });
    }

    const attempt = paymentAttempts.find((a) => a.id === order.activePaymentAttemptId);
    const channel = method || order.paymentChannel || "CASH";

    if (attempt) {
      attempt.status = "success";
      attempt.providerRef = providerRef || attempt.providerRef;
      attempt.confirmedBy = confirmedBy;
      attempt.confirmedAt = new Date().toISOString();
      if (note) attempt.note = note;
    }

    order.paymentStatus = "PAID";
    order.status = "PAID";
    order.paymentChannel = channel;
    order.transactionRef =
      providerRef ||
      attempt?.providerRef ||
      `${channel}-${order.orderNumber}-${Date.now()}`;
    order.paidAt = new Date().toISOString();
    order.activePaymentAttemptId = undefined;

    const saved = await saveDbOrder(order);

    res.json({
      success: true,
      message: `Order ${order.orderNumber} marked PAID after confirmation`,
      order: saved,
    });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
}

export async function getPaymentAttempt(req: Request, res: Response) {
  try {
    const orderId = req.params.orderId;
    const orders = await getDbOrders();
    const order = orders.find((o) => o.id === orderId);
    if (!order) return res.status(404).json({ success: false, error: "Order not found" });

    const attempt = paymentAttempts.find((a) => a.id === order.activePaymentAttemptId) || null;
    res.json({
      success: true,
      orderNumber: order.orderNumber,
      paymentStatus: order.paymentStatus,
      attempt,
    });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
}
