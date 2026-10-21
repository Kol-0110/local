export type PaymentChannel = "CASH" | "ETHQR" | "USSD_PUSH" | "CARD" | null;

export function startOrderPayment(
  orderId: string,
  channel: Exclude<PaymentChannel, null>,
  provider?: "telebirr" | "cbe" | "cash" | "ethqr"
) {
  initStore();
  const order = globalOrders.find((o) => o.id === orderId);
  if (!order || order.paymentStatus === "PAID") return null;

  order.paymentStatus = "AWAITING_PAYMENT" as any;
  order.paymentChannel = channel;
  order.paymentProvider =
    provider || (channel === "CASH" ? "cash" : channel === "ETHQR" ? "ethqr" : "telebirr");

  saveStorage("bgs-pos-orders", globalOrders);
  notifyChange();
  return order;
}

/** Only call after real confirmation — never from screenshot alone */
export function confirmOrderPayment(
  orderId: string,
  channel: Exclude<PaymentChannel, null>,
  transactionRef?: string,
  confirmedBy = "cashier"
): Order | null {
  initStore();
  const order = globalOrders.find((o) => o.id === orderId);
  if (!order || order.paymentStatus === "PAID") return order || null;

  order.paymentStatus = "PAID";
  order.status = "PAID";
  order.paymentChannel = channel;
  order.paymentProvider =
    channel === "CASH" ? "cash" : channel === "ETHQR" ? "ethqr" : "telebirr";
  order.transactionRef =
    transactionRef || `${channel}-${order.orderNumber}-${Date.now()}`;
  order.paidAt = new Date().toISOString();

  saveStorage("bgs-pos-orders", globalOrders);
  notifyChange();

  // optional: POST /api/payments/confirm
  return order;
}

/** Waiter app: store OTP for cashier UI (local) */
export function relayOtpToCashier(orderId: string, otp: string, waiterId: string) {
  initStore();
  const order = globalOrders.find((o) => o.id === orderId);
  if (!order || order.waiterId !== waiterId) return false;
  (order as any).relayedOtp = otp;
  (order as any).otpRelayedAt = new Date().toISOString();
  saveStorage("bgs-pos-orders", globalOrders);
  notifyChange();
  return true;
}
