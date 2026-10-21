"use client";

import React, { useState } from "react";
import {
  X,
  Banknote,
  QrCode,
  Smartphone,
  CheckCircle2,
  Loader2,
  ShieldAlert,
  Hash,
} from "lucide-react";
import { Order, PaymentChannel, startOrderPayment, confirmOrderPayment } from "@/lib/store";

interface PaymentModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (paidOrder: Order) => void;
  cashierName?: string;
}

export default function PaymentModal({
  order,
  isOpen,
  onClose,
  onPaymentSuccess,
  cashierName = "Cashier",
}: PaymentModalProps) {
  const [selectedChannel, setSelectedChannel] = useState<PaymentChannel>("CASH");
  const [qrProvider, setQrProvider] = useState<"telebirr" | "cbe">("telebirr");
  const [tenderedAmount, setTenderedAmount] = useState<number | "">("");
  const [otpFromWaiter, setOtpFromWaiter] = useState("");
  const [providerRef, setProviderRef] = useState("");
  const [step, setStep] = useState<"choose" | "awaiting" | "done">("choose");
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !order) return null;

  const total = order.totalAmount;
  const orderRef = order.orderNumber;
  const numericTendered = typeof tenderedAmount === "number" ? tenderedAmount : 0;
  const changeDue = Math.max(0, numericTendered - total);
  const isCashSufficient = numericTendered >= total;

  const beginPayment = (channel: PaymentChannel) => {
    if (!channel) return;
    startOrderPayment(order.id, channel, qrProvider === "cbe" ? "cbe" : "telebirr");
    setSelectedChannel(channel);
    setStep("awaiting");
  };

  const completeCash = () => {
    if (!isCashSufficient) return;
    setIsProcessing(true);
    const paid = confirmOrderPayment(order.id, "CASH", undefined, cashierName);
    setIsProcessing(false);
    if (paid) {
      setStep("done");
      onPaymentSuccess(paid);
    }
  };

  const completeVerifiedDigital = () => {
    setIsProcessing(true);
    const ref =
      providerRef.trim() ||
      `${selectedChannel}-${orderRef}-${Date.now()}`;
    const paid = confirmOrderPayment(
      order.id,
      selectedChannel || "ETHQR",
      ref,
      cashierName
    );
    setIsProcessing(false);
    if (paid) {
      setStep("done");
      onPaymentSuccess(paid);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between bg-emerald-700 px-4 py-3 text-white">
          <div>
            <div className="text-sm opacity-90">Pay order</div>
            <div className="font-bold text-lg flex items-center gap-2">
              <Hash className="w-4 h-4" /> {orderRef}
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10">
            <X />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-emerald-800">
              {total.toLocaleString()} <span className="text-base">ETB</span>
            </div>
            <div className="text-xs text-slate-500">
              Waiter: {order.waiterName} · Payment must match this Order ID
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <p>
              Never mark paid from a screenshot alone. Confirm real cash, real
              QR success, or real Telebirr merchant success (OTP only helps the
              cashier finish the merchant step).
            </p>
          </div>

          {step === "choose" && (
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => beginPayment("CASH")}
                className="rounded-xl border-2 border-emerald-500 bg-emerald-50 py-3 text-sm font-semibold"
              >
                <Banknote className="mx-auto mb-1" /> Cash
              </button>
              <button
                onClick={() => beginPayment("ETHQR")}
                className="rounded-xl border-2 border-slate-200 py-3 text-sm font-semibold hover:border-emerald-400"
              >
                <QrCode className="mx-auto mb-1" /> ETHQR
              </button>
              <button
                onClick={() => beginPayment("USSD_PUSH")}
                className="rounded-xl border-2 border-slate-200 py-3 text-sm font-semibold hover:border-emerald-400"
              >
                <Smartphone className="mx-auto mb-1" /> USSD
              </button>
            </div>
          )}

          {step === "awaiting" && selectedChannel === "CASH" && (
            <div className="space-y-3">
              <label className="text-sm font-medium">Cash tendered</label>
              <input
                type="number"
                className="w-full rounded-lg border px-3 py-2"
                value={tenderedAmount}
                onChange={(e) =>
                  setTenderedAmount(e.target.value === "" ? "" : Number(e.target.value))
                }
              />
              <div className="flex gap-2">
                {[0, 50, 100, 200].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className="flex-1 rounded-lg bg-slate-100 py-2 text-xs"
                    onClick={() =>
                      setTenderedAmount(n === 0 ? total : (typeof tenderedAmount === "number" ? tenderedAmount : 0) + n)
                    }
                  >
                    {n === 0 ? "Exact" : `+${n}`}
                  </button>
                ))}
              </div>
              <div className="text-sm">Change: <b>{changeDue.toLocaleString()} ETB</b></div>
              <button
                disabled={!isCashSufficient || isProcessing}
                onClick={completeCash}
                className="w-full rounded-xl bg-emerald-600 py-3 font-bold text-white disabled:opacity-40"
              >
                {isProcessing ? <Loader2 className="mx-auto animate-spin" /> : "Confirm cash received"}
              </button>
            </div>
          )}

          {step === "awaiting" && selectedChannel === "ETHQR" && (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">
                Show merchant ETHQR. Customer pays <b>{total.toLocaleString()} ETB</b>.
                Put Order ID <b>{orderRef}</b> in the payment note if the app allows.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setQrProvider("telebirr")}
                  className={`flex-1 rounded-lg py-2 text-sm border ${qrProvider === "telebirr" ? "border-emerald-500 bg-emerald-50" : ""}`}
                >
                  Telebirr
                </button>
                <button
                  type="button"
                  onClick={() => setQrProvider("cbe")}
                  className={`flex-1 rounded-lg py-2 text-sm border ${qrProvider === "cbe" ? "border-emerald-500 bg-emerald-50" : ""}`}
                >
                  CBE / Bank
                </button>
              </div>
              <input
                className="w-full rounded-lg border px-3 py-2 text-sm"
                placeholder="Provider ref / txn id (from real receipt)"
                value={providerRef}
                onChange={(e) => setProviderRef(e.target.value)}
              />
              <button
                disabled={isProcessing}
                onClick={completeVerifiedDigital}
                className="w-full rounded-xl bg-emerald-600 py-3 font-bold text-white"
              >
                I verified payment on merchant account — Mark PAID
              </button>
            </div>
          )}

          {step === "awaiting" && selectedChannel === "USSD_PUSH" && (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">
                Start Telebirr/USSD for <b>{orderRef}</b>. Customer gets OTP →
                waiter sends OTP here → you finish merchant confirm → then mark paid.
              </p>
              <input
                className="w-full rounded-lg border px-3 py-2 text-sm"
                placeholder="OTP from waiter"
                value={otpFromWaiter}
                onChange={(e) => setOtpFromWaiter(e.target.value)}
              />
              <input
                className="w-full rounded-lg border px-3 py-2 text-sm"
                placeholder="Txn ref after success (optional)"
                value={providerRef}
                onChange={(e) => setProviderRef(e.target.value)}
              />
              <button
                disabled={isProcessing || !otpFromWaiter.trim()}
                onClick={completeVerifiedDigital}
                className="w-full rounded-xl bg-emerald-600 py-3 font-bold text-white disabled:opacity-40"
              >
                Merchant success confirmed — Mark PAID
              </button>
            </div>
          )}

          {step === "done" && (
            <div className="text-center py-6 text-emerald-700">
              <CheckCircle2 className="mx-auto mb-2 h-10 w-10" />
              <div className="font-bold">Order {orderRef} paid</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
