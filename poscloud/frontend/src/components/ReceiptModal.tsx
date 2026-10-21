"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { X, Printer, CheckCircle2 } from "lucide-react";
import { Order } from "@/lib/store";

interface ReceiptModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ReceiptModal({ order, isOpen, onClose }: ReceiptModalProps) {
  const { t } = useTranslation();

  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = order.paidAt
    ? new Date(order.paidAt).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : new Date().toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="relative flex max-h-[95vh] w-full max-w-md flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3.5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              {t("receipt.title")}
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Receipt Container (Scrollable & printable) */}
        <div className="overflow-y-auto p-5">
          <div
            id="printable-receipt"
            className="mx-auto rounded-xl border border-slate-200 bg-white p-5 text-slate-900 shadow-sm font-mono text-xs dark:bg-zinc-950 dark:text-zinc-100 dark:border-zinc-800"
          >
            {/* Header / Brand info */}
            <div className="text-center space-y-1">
              <h2 className="text-base font-black tracking-wider uppercase text-slate-950 dark:text-white">
                CLOUD POS BGS
              </h2>
              <p className="text-[11px] font-semibold text-slate-600 dark:text-zinc-400">
                BGS Hospitality & Dining Group
              </p>
              <p className="text-[10px] text-slate-500 dark:text-zinc-500">
                Bole Medhanialem • Addis Ababa, Ethiopia
              </p>
              <p className="text-[10px] text-slate-500 dark:text-zinc-500">
                TIN: 0049281729 • Tel: +251 911 234 567
              </p>
              <div className="my-2 border-y border-dashed border-slate-400 py-1 text-[11px] font-bold uppercase tracking-wider text-center">
                {t("receipt.taxInvoice")}
              </div>
            </div>

            {/* Metadata */}
            <div className="my-3 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-zinc-400">{t("receipt.orderNo")}:</span>
                <span className="font-bold">#{order.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-zinc-400">{t("receipt.tableNo")}:</span>
                <span className="font-bold">{order.tableNumber ? `Table ${order.tableNumber}` : "Takeout / Counter"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-zinc-400">{t("receipt.date")}:</span>
                <span>{formattedDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-zinc-400">{t("receipt.cashier")}:</span>
                <span>{order.waiterName || "BGS Cashier #1"}</span>
              </div>
            </div>

            {/* Items separator */}
            <div className="border-t border-dashed border-slate-300 dark:border-zinc-700 my-2" />

            {/* Table Items Header */}
            <div className="flex justify-between text-[11px] font-bold uppercase text-slate-600 dark:text-zinc-400 mb-1">
              <span className="w-1/2">{t("receipt.item")}</span>
              <span className="w-1/6 text-center">{t("receipt.qty")}</span>
              <span className="w-1/3 text-right">{t("receipt.total")}</span>
            </div>

            <div className="border-b border-dashed border-slate-300 dark:border-zinc-700 mb-2" />

            {/* Items list */}
            <div className="space-y-1.5 text-[11px]">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between items-baseline">
                  <div className="w-1/2 pr-1">
                    <p className="font-semibold text-slate-900 dark:text-white leading-tight">
                      {item.name}
                    </p>
                    {item.notes && (
                      <p className="text-[10px] text-slate-500 italic">*{item.notes}</p>
                    )}
                  </div>
                  <div className="w-1/6 text-center text-slate-600 dark:text-zinc-400">
                    {item.quantity}x
                  </div>
                  <div className="w-1/3 text-right font-medium">
                    {item.totalPrice.toLocaleString()} ETB
                  </div>
                </div>
              ))}
            </div>

            {/* Financials Breakdown */}
            <div className="border-t border-dashed border-slate-300 dark:border-zinc-700 my-3" />

            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between text-slate-600 dark:text-zinc-400">
                <span>Subtotal:</span>
                <span>{order.subtotal.toLocaleString()} ETB</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-zinc-400">
                <span>{t("receipt.service")}:</span>
                <span>{order.serviceCharge.toLocaleString()} ETB</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-zinc-400">
                <span>{t("receipt.vat")}:</span>
                <span>{order.vat.toLocaleString()} ETB</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Discount:</span>
                  <span>-{order.discountAmount.toLocaleString()} ETB</span>
                </div>
              )}
            </div>

            {/* Grand Total */}
            <div className="border-t-2 border-slate-900 dark:border-white my-2" />
            <div className="flex justify-between text-sm font-black">
              <span className="uppercase">TOTAL DUE:</span>
              <span className="text-emerald-700 dark:text-emerald-400">
                {order.totalAmount.toLocaleString()} ETB
              </span>
            </div>
            <div className="border-b-2 border-slate-900 dark:border-white my-2" />

            {/* Payment Details */}
            <div className="space-y-1 text-[10px] text-slate-600 dark:text-zinc-400 mt-2">
              <div className="flex justify-between">
                <span>{t("receipt.paidWith")}:</span>
                <span className="font-bold uppercase text-slate-900 dark:text-white">
                  {order.paymentChannel || "CASH"}
                </span>
              </div>
              {order.transactionRef && (
                <div className="flex justify-between">
                  <span>Ref:</span>
                  <span className="font-mono">{order.transactionRef}</span>
                </div>
              )}
            </div>

            {/* Ethiopian Fiscal QR & Footer */}
            <div className="mt-4 pt-3 border-t border-dashed border-slate-300 text-center space-y-1.5 dark:border-zinc-700">
              <div className="mx-auto h-14 w-14 rounded border border-slate-300 p-1 bg-white dark:bg-zinc-900 flex items-center justify-center">
                <span className="text-[8px] font-mono text-slate-400">ERCA QR</span>
              </div>
              <p className="text-[11px] font-bold text-slate-800 dark:text-zinc-200">
                {t("receipt.thankYou")}
              </p>
              <p className="text-[9px] text-slate-400">
                Powered by Cloud POS BGS Enterprise
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-3 border-t border-slate-200 bg-slate-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <button
            onClick={handlePrint}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-xs font-bold text-white shadow hover:bg-slate-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 transition"
          >
            <Printer className="h-4 w-4" />
            <span>{t("receipt.print")}</span>
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-300 bg-white py-3 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 transition"
          >
            {t("receipt.done")}
          </button>
        </div>
      </div>
    </div>
  );
}
