"use client";

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  X,
  Banknote,
  QrCode,
  Smartphone,
  CheckCircle2,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Order, payOrder, PaymentChannel } from "@/lib/store";

interface PaymentModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (paidOrder: Order) => void;
}

export default function PaymentModal({
  order,
  isOpen,
  onClose,
  onPaymentSuccess,
}: PaymentModalProps) {
  const { t } = useTranslation();
  const [selectedChannel, setSelectedChannel] = useState<PaymentChannel>("CASH");
  const [qrProvider, setQrProvider] = useState<"telebirr" | "cbe">("telebirr");
  const [tenderedAmount, setTenderedAmount] = useState<number | "">("");
  const [phoneNumber, setPhoneNumber] = useState("0911223344");
  const [isProcessing, setIsProcessing] = useState(false);
  const [ussdStep, setUssdStep] = useState<"idle" | "sent" | "success">("idle");

  if (!isOpen || !order) return null;

  const total = order.totalAmount;
  const numericTendered = typeof tenderedAmount === "number" ? tenderedAmount : 0;
  const changeDue = Math.max(0, numericTendered - total);
  const isCashSufficient = numericTendered >= total;

  const handleCashTenderPreset = (addAmount: number) => {
    if (addAmount === 0) {
      setTenderedAmount(total);
    } else {
      setTenderedAmount((prev) => (typeof prev === "number" ? prev + addAmount : total + addAmount));
    }
  };

  const handleCompleteCashPayment = () => {
    if (!isCashSufficient) return;
    setIsProcessing(true);
    setTimeout(() => {
      const paid = payOrder(order.id, "CASH", undefined, "cash");
      setIsProcessing(false);
      if (paid) onPaymentSuccess(paid);
    }, 400);
  };

  const handleCompleteQrPayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const ref = `TXN-${qrProvider.toUpperCase()}-${Math.floor(1000000 + Math.random() * 9000000)}`;
      const paid = payOrder(order.id, "ETHQR", ref, qrProvider);
      setIsProcessing(false);
      if (paid) onPaymentSuccess(paid);
    }, 600);
  };

  const handleTriggerUssd = () => {
    setUssdStep("sent");
    setTimeout(() => {
      setUssdStep("success");
      setTimeout(() => {
        const ref = `USSD-${Math.floor(1000000 + Math.random() * 9000000)}`;
        const paid = payOrder(order.id, "USSD_PUSH", ref, "telebirr");
        if (paid) onPaymentSuccess(paid);
      }, 700);
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900/80">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {t("payment.title")}
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Order #{order.orderNumber} {order.tableNumber ? `• Table ${order.tableNumber}` : "• Takeout"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Total Banner */}
        <div className="border-b border-slate-100 bg-emerald-500/10 px-6 py-4 text-center dark:border-zinc-800/60">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            {t("payment.amountDue")}
          </p>
          <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-emerald-700 dark:text-emerald-400">
            {total.toLocaleString()} <span className="text-xl font-bold">{t("common.currency")}</span>
          </p>
        </div>

        {/* Channel Selection Tabs */}
        <div className="grid grid-cols-3 border-b border-slate-200 bg-slate-100/60 p-1.5 dark:border-zinc-800 dark:bg-zinc-950">
          <button
            onClick={() => setSelectedChannel("CASH")}
            className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition ${
              selectedChannel === "CASH"
                ? "bg-white text-emerald-700 shadow-sm dark:bg-zinc-800 dark:text-emerald-400"
                : "text-slate-600 hover:bg-white/50 dark:text-zinc-400"
            }`}
          >
            <Banknote className="h-4 w-4" />
            <span>{t("payment.cash")}</span>
          </button>

          <button
            onClick={() => setSelectedChannel("ETHQR")}
            className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition ${
              selectedChannel === "ETHQR"
                ? "bg-white text-emerald-700 shadow-sm dark:bg-zinc-800 dark:text-emerald-400"
                : "text-slate-600 hover:bg-white/50 dark:text-zinc-400"
            }`}
          >
            <QrCode className="h-4 w-4" />
            <span>ETHQR</span>
          </button>

          <button
            onClick={() => setSelectedChannel("USSD_PUSH")}
            className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition ${
              selectedChannel === "USSD_PUSH"
                ? "bg-white text-emerald-700 shadow-sm dark:bg-zinc-800 dark:text-emerald-400"
                : "text-slate-600 hover:bg-white/50 dark:text-zinc-400"
            }`}
          >
            <Smartphone className="h-4 w-4" />
            <span>USSD Push</span>
          </button>
        </div>

        {/* Modal Body Based on Channel */}
        <div className="p-6">
          {/* CASH */}
          {selectedChannel === "CASH" && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase text-slate-500 dark:text-zinc-400">
                  {t("payment.tendered")} (ETB)
                </label>
                <div className="relative mt-1">
                  <input
                    type="number"
                    value={tenderedAmount}
                    onChange={(e) => setTenderedAmount(e.target.value ? Number(e.target.value) : "")}
                    placeholder={String(total)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-xl font-bold text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                  <span className="absolute right-3 top-3 text-sm font-semibold text-slate-400">ETB</span>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => handleCashTenderPreset(0)}
                  className="rounded-lg border border-slate-200 bg-slate-50 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                >
                  {t("payment.exact")}
                </button>
                {[50, 100, 200].map((add) => (
                  <button
                    key={add}
                    type="button"
                    onClick={() => handleCashTenderPreset(add)}
                    className="rounded-lg border border-slate-200 bg-slate-50 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                  >
                    +{add}
                  </button>
                ))}
              </div>

              {/* Change Indicator */}
              {numericTendered > 0 && (
                <div
                  className={`flex items-center justify-between rounded-xl p-3.5 ${
                    isCashSufficient
                      ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                      : "border border-rose-500/30 bg-rose-500/10 text-rose-800 dark:text-rose-300"
                  }`}
                >
                  <span className="text-xs font-semibold">
                    {isCashSufficient ? t("payment.change") : "Insufficient Amount:"}
                  </span>
                  <span className="text-lg font-bold">
                    {changeDue} ETB
                  </span>
                </div>
              )}

              <button
                disabled={!isCashSufficient || isProcessing}
                onClick={handleCompleteCashPayment}
                className="w-full rounded-xl bg-emerald-600 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 disabled:opacity-50 transition active:scale-98 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5" />
                    <span>Complete Settlement ({total} ETB)</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* ETHQR */}
          {selectedChannel === "ETHQR" && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setQrProvider("telebirr")}
                  className={`flex-1 rounded-xl py-2 text-xs font-bold border transition ${
                    qrProvider === "telebirr"
                      ? "border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : "border-slate-200 text-slate-600 dark:border-zinc-700 dark:text-zinc-400"
                  }`}
                >
                  Telebirr QR
                </button>
                <button
                  onClick={() => setQrProvider("cbe")}
                  className={`flex-1 rounded-xl py-2 text-xs font-bold border transition ${
                    qrProvider === "cbe"
                      ? "border-purple-600 bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300"
                      : "border-slate-200 text-slate-600 dark:border-zinc-700 dark:text-zinc-400"
                  }`}
                >
                  CBE Birr QR
                </button>
              </div>

              <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-zinc-800 dark:bg-zinc-950">
                <div className="rounded-xl bg-white p-3 shadow-md">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
                      `BGS-${qrProvider.toUpperCase()}-${total}ETB-${order.orderNumber}`
                    )}`}
                    alt="ETHQR Code"
                    className="h-40 w-40"
                  />
                </div>
                <p className="mt-3 text-xs font-bold text-slate-700 dark:text-zinc-300">
                  {t("payment.scanQr")}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Total: {total} ETB • Ref #{order.orderNumber}
                </p>
              </div>

              <button
                disabled={isProcessing}
                onClick={handleCompleteQrPayment}
                className="w-full rounded-xl bg-emerald-600 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 transition active:scale-98 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5" />
                    <span>Confirm Verified QR Payment</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* USSD PUSH */}
          {selectedChannel === "USSD_PUSH" && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase text-slate-500 dark:text-zinc-400">
                  {t("payment.phone")}
                </label>
                <div className="relative mt-1">
                  <Smartphone className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="0911223344"
                    className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 py-3 text-base font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                </div>
              </div>

              {ussdStep === "sent" && (
                <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-3.5 text-center text-xs font-semibold text-cyan-800 dark:text-cyan-300 animate-pulse">
                  {t("payment.pushSent")}
                </div>
              )}

              {ussdStep === "success" && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-center text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  ✓ PIN verified by customer! Settle complete.
                </div>
              )}

              <button
                disabled={ussdStep === "sent"}
                onClick={handleTriggerUssd}
                className="w-full rounded-xl bg-cyan-600 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-cyan-600/30 hover:bg-cyan-700 disabled:opacity-50 transition active:scale-98 flex items-center justify-center gap-2"
              >
                {ussdStep === "sent" ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Smartphone className="h-5 w-5" />
                    <span>{t("payment.sendPush")} ({total} ETB)</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
