"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (password === "owner123" || password === "bgs123") {
      localStorage.setItem("owner-logged-in", "true");
      router.push("/");
    } else {
      setError("Incorrect password. Please try 'bgs123' or 'owner123'.");
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-50 p-4 dark:bg-zinc-950">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
        
        {/* Brand Badge */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-400 text-2xl font-black text-white shadow-xl shadow-emerald-600/30">
            POS
          </div>
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Cloud POS
            </h1>
            <span className="rounded-md bg-emerald-600 px-2 py-0.5 text-xs font-black uppercase text-white">
              BGS
            </span>
          </div>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-zinc-400">
            Enterprise Multi-Tenant Restaurant & Retail System
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-zinc-300">
              Staff / Manager Access Key
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                placeholder="Enter access password"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                autoFocus
              />
              <Lock className="absolute right-3.5 top-3.5 h-4 w-4 text-slate-400" />
            </div>
            {error && (
              <p className="mt-2 text-xs font-bold text-rose-600 dark:text-rose-400">
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-sm font-black text-white shadow-lg shadow-emerald-600/30 transition hover:bg-emerald-500"
          >
            <span>Enter POS System</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50 p-3 text-center dark:border-zinc-800 dark:bg-zinc-950/60">
          <p className="text-[11px] text-slate-500 dark:text-zinc-400">
            Demo password: <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">owner123</span> or <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">bgs123</span>
          </p>
        </div>
      </div>
    </div>
  );
}
