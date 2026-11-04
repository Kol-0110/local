"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Lock,
  Mail,
  User as UserIcon,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Database,
  Crown,
  Shield,
  Layers,
} from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { getServerStatus } from "@/lib/api";

type AuthMode = "login" | "register";

export default function LoginPage() {
  const router = useRouter();
  const { login, register, user, isLoggedIn } = useAuth();

  const [mode, setMode] = useState<AuthMode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Live DB status
  const [dbState, setDbState] = useState<{ connected: boolean; message: string }>({
    connected: false,
    message: "Checking database status...",
  });

  useEffect(() => {
    getServerStatus()
      .then((data) => {
        setDbState({
          connected: data.connected,
          message: data.connected ? "MongoDB Atlas Live" : "Local Sync Memory",
        });
      })
      .catch(() => {
        setDbState({
          connected: false,
          message: "API Gateway Online",
        });
      });
  }, []);

  // Quick fill preset roles
  const fillPreset = (role: "super_admin" | "admin" | "user") => {
    setMode("login");
    setError(null);
    setSuccessMsg(null);
    if (role === "super_admin") {
      setEmail("superadmin@cloudpos.com");
      setPassword("SuperAdmin123!");
    } else if (role === "admin") {
      setEmail("admin@cloudpos.com");
      setPassword("Admin123!");
    } else {
      setEmail("user@cloudpos.com");
      setPassword("User123!");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      if (mode === "login") {
        if (!email || !password) {
          throw new Error("Please enter both email and password.");
        }
        const res = await login(email, password);
        setSuccessMsg(`Welcome back, ${res.user.name}! Access role: ${res.user.role.toUpperCase()}`);
        setTimeout(() => {
          if (res.user.role === "super_admin" || res.user.role === "admin") {
            router.push("/");
          } else {
            router.push("/pos");
          }
        }, 800);
      } else {
        // Sign Up Mode
        if (!name.trim()) throw new Error("Full name is required.");
        if (!email.trim() || !email.includes("@")) throw new Error("A valid email is required.");
        if (password.length < 6) throw new Error("Password must be at least 6 characters.");
        if (password !== confirmPassword) throw new Error("Passwords do not match.");

        const res = await register(name, email, password);
        setSuccessMsg(`Account created! Default role: '${res.user.role}' assigned. Logging you in...`);
        setTimeout(() => {
          router.push("/pos");
        }, 1000);
      }
    } catch (err: any) {
      setError(err?.message || "Authentication failed. Please check credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 overflow-hidden bg-slate-950">
      
      {/* Dynamic Ambient Background Glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-teal-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-1/3 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-lg rounded-3xl border border-zinc-800 bg-zinc-900/90 backdrop-blur-xl p-6 sm:p-8 shadow-2xl shadow-black/80">
        
        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-400 text-2xl font-black text-white shadow-xl shadow-emerald-600/30">
            POS
          </div>
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-white">
              Cloud POS Portal
            </h1>
            <span className="rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">
              RBAC v2
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            Enterprise Restaurant & Bar Management • Role-Based Access
          </p>

          {/* Database Live Connectivity Badge */}
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950/70 px-3 py-1 text-xs text-zinc-300">
            <span
              className={`h-2 w-2 rounded-full ${
                dbState.connected
                  ? "bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/80"
                  : "bg-cyan-400"
              }`}
            />
            <Database className="h-3 w-3 text-zinc-400" />
            <span className="text-[11px] font-medium">{dbState.message}</span>
          </div>
        </div>

        {/* Tab Switcher: Sign In vs Sign Up */}
        <div className="mb-6 flex rounded-xl bg-zinc-950 p-1 border border-zinc-800/80">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${
              mode === "login"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Sign In to Existing Account
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setError(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${
              mode === "register"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Create Account (Sign Up)
          </button>
        </div>

        {/* 1-Click Quick Demo Role Switcher */}
        {mode === "login" && (
          <div className="mb-6 rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-3">
            <div className="mb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-amber-400" />
                Quick Test Credentials
              </span>
              <span className="text-[10px] text-zinc-500">1-Click autofill</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillPreset("super_admin")}
                className="flex flex-col items-center justify-center gap-1 rounded-xl border border-purple-500/30 bg-purple-500/10 p-2 text-center text-purple-300 hover:bg-purple-500/20 transition"
              >
                <Crown className="h-4 w-4 text-purple-400" />
                <span className="text-[11px] font-bold">Super Admin</span>
              </button>
              <button
                type="button"
                onClick={() => fillPreset("admin")}
                className="flex flex-col items-center justify-center gap-1 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2 text-center text-emerald-300 hover:bg-emerald-500/20 transition"
              >
                <Shield className="h-4 w-4 text-emerald-400" />
                <span className="text-[11px] font-bold">Admin</span>
              </button>
              <button
                type="button"
                onClick={() => fillPreset("user")}
                className="flex flex-col items-center justify-center gap-1 rounded-xl border border-blue-500/30 bg-blue-500/10 p-2 text-center text-blue-300 hover:bg-blue-500/20 transition"
              >
                <UserIcon className="h-4 w-4 text-blue-400" />
                <span className="text-[11px] font-bold">Standard User</span>
              </button>
            </div>
          </div>
        )}

        {/* Informative Notice for Sign Up Role Policy */}
        {mode === "register" && (
          <div className="mb-5 rounded-2xl border border-blue-500/30 bg-blue-500/10 p-3.5 text-xs text-blue-200">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-blue-100">Role Policy Notice:</p>
                <p className="mt-0.5 text-blue-200/90 leading-relaxed text-[11px]">
                  Whenever any person signs up, their account is strictly assigned the standard{" "}
                  <span className="font-bold underline text-white">User</span> role by default.
                  Elevated permissions (<span className="text-purple-300 font-semibold">Super Admin</span> or{" "}
                  <span className="text-emerald-300 font-semibold">Admin</span>) can subsequently be granted by authorized administrators.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Feedback Alerts */}
        {error && (
          <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-semibold text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Main Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Full Name field (Sign Up only) */}
          {mode === "register" && (
            <div>
              <label className="mb-1 block text-xs font-bold text-zinc-300">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Almaz Kebede"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 px-4 py-3 pl-10 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  required
                />
                <UserIcon className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-400" />
              </div>
            </div>
          )}

          {/* Email field */}
          <div>
            <label className="mb-1 block text-xs font-bold text-zinc-300">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@cloudpos.com"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 px-4 py-3 pl-10 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                required
                autoComplete="email"
              />
              <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-400" />
            </div>
          </div>

          {/* Password field */}
          <div>
            <label className="mb-1 block text-xs font-bold text-zinc-300">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 px-4 py-3 pl-10 pr-10 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                required
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
              <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-400" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-zinc-400 hover:text-white transition"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password (Sign Up only) */}
          {mode === "register" && (
            <div>
              <label className="mb-1 block text-xs font-bold text-zinc-300">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 px-4 py-3 pl-10 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  required
                />
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-400" />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3.5 text-sm font-black text-white shadow-lg shadow-emerald-600/30 transition hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Processing...</span>
              </span>
            ) : mode === "login" ? (
              <>
                <span>Sign In to POS</span>
                <ArrowRight className="h-4 w-4" />
              </>
            ) : (
              <>
                <span>Complete Registration (Role: User)</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
          <span>Protected Cloud System</span>
          <Link href="/" className="hover:text-emerald-400 transition font-medium">
            Return to Dashboard →
          </Link>
        </div>
      </div>
    </div>
  );
}
