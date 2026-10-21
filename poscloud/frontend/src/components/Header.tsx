"use client";

import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sun,
  Moon,
  ChevronDown,
  Globe,
  LayoutDashboard,
  ShoppingBag,
  Grid3X3,
  BookOpen,
  ReceiptText,
  Wifi,
  Menu as MenuIcon,
  X,
  Store,
  UserCheck,
  Smartphone,
  Database,
  Sparkles,
} from "lucide-react";
import { BRANCHES, usePOSStore, setActiveWaiter } from "@/lib/store";

type LanguageCode = "en" | "am" | "om";

const LANGUAGES = [
  { code: "en" as LanguageCode, native: "English", flag: "🇬🇧" },
  { code: "am" as LanguageCode, native: "አማርኛ", flag: "🇪🇹" },
  { code: "om" as LanguageCode, native: "Afaan Oromoo", flag: "🇪🇹" },
];

export default function Header() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const { waiters, activeWaiter } = usePOSStore();

  const [mounted, setMounted] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [branchOpen, setBranchOpen] = useState(false);
  const [waiterOpen, setWaiterOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeBranch, setActiveBranch] = useState("bole");
  const [dbStatus, setDbStatus] = useState<"connected" | "ready" | "fallback">("ready");

  const langRef = useRef<HTMLDivElement>(null);
  const branchRef = useRef<HTMLDivElement>(null);
  const waiterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const savedBranch = localStorage.getItem("bgs-selected-branch");
    if (savedBranch) setActiveBranch(savedBranch);

    // Check DB status
    fetch("/api/status")
      .then((res) => res.json())
      .then((data) => {
        if (data.connected) setDbStatus("connected");
        else setDbStatus("fallback");
      })
      .catch(() => setDbStatus("fallback"));
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
      if (branchRef.current && !branchRef.current.contains(e.target as Node)) {
        setBranchOpen(false);
      }
      if (waiterRef.current && !waiterRef.current.contains(e.target as Node)) {
        setWaiterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const changeLanguage = (code: LanguageCode) => {
    i18n.changeLanguage(code);
    localStorage.setItem("pos-lang", code);
    setLangOpen(false);
  };

  const handleBranchSelect = (branchId: string) => {
    setActiveBranch(branchId);
    localStorage.setItem("bgs-selected-branch", branchId);
    setBranchOpen(false);
    window.dispatchEvent(new CustomEvent("branch_switched", { detail: branchId }));
  };

  const handleWaiterSelect = (id: string) => {
    setActiveWaiter(id);
    setWaiterOpen(false);
  };

  const currentLang = LANGUAGES.find((l) => l.code === i18n.language) ?? LANGUAGES[0];
  const currentBranch = BRANCHES.find((b) => b.id === activeBranch) ?? BRANCHES[0];

  const navItems = [
    { href: "/", label: "Owner Dashboard", icon: LayoutDashboard },
    { href: "/waiter", label: "Waiter Mode", icon: Smartphone, highlight: true },
    { href: "/pos", label: "Register / POS", icon: ShoppingBag },
    { href: "/tables", label: "Floor Tables", icon: Grid3X3 },
    { href: "/menu", label: "Menu & Cost", icon: BookOpen },
    { href: "/receipts", label: "Sales Log", icon: ReceiptText },
  ];

  if (!mounted) {
    return (
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="h-9 w-36 animate-pulse rounded bg-slate-200 dark:bg-zinc-800" />
        <div className="h-9 w-64 animate-pulse rounded bg-slate-200 dark:bg-zinc-800" />
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/95 shadow-sm">
      <div className="mx-auto flex h-16 max-w-[1700px] items-center justify-between px-3 sm:px-6">
        
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3 lg:gap-5">
          <Link href="/" className="group flex items-center gap-2.5 transition">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-500 text-white font-extrabold text-sm shadow-md shadow-emerald-600/25 group-hover:scale-105 transition-transform">
              BGS
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                BGS Cloud
              </span>
              <span className="rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ring-1 ring-emerald-500/30">
                PROFIT POS
              </span>
            </div>
          </Link>

          {/* Branch Switcher Dropdown */}
          <div className="relative hidden md:block" ref={branchRef}>
            <button
              onClick={() => setBranchOpen(!branchOpen)}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-200 dark:hover:bg-zinc-800 transition"
              title="Select Active Branch"
            >
              <Store className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{currentBranch.name}</span>
              <ChevronDown className={`h-3.5 w-3.5 opacity-60 transition ${branchOpen ? "rotate-180" : ""}`} />
            </button>

            {branchOpen && (
              <div className="absolute left-0 mt-1.5 w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 z-50">
                <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  Select Branch
                </div>
                {BRANCHES.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => handleBranchSelect(b.id)}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition ${
                      b.id === activeBranch
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold"
                        : "text-slate-600 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <span>{b.name}</span>
                    {b.id === activeBranch && <span className="text-emerald-600">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center: Main Navigation Bar */}
        <nav className="hidden lg:flex items-center gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  isActive
                    ? item.highlight
                      ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm shadow-orange-500/30 font-bold"
                      : "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 font-bold"
                    : item.highlight
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 font-bold"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-white" : "opacity-80"}`} />
                <span>{item.label}</span>
                {item.highlight && !isActive && (
                  <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Active Waiter Selector */}
          <div className="relative" ref={waiterRef}>
            <button
              onClick={() => setWaiterOpen(!waiterOpen)}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-2.5 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 transition shadow-sm"
              title="Switch Active Waiter"
            >
              <span className="text-base leading-none">{activeWaiter?.avatar || "👤"}</span>
              <div className="text-left leading-tight hidden sm:block">
                <span className="block text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-400">
                  Waiter
                </span>
                <span className="block font-bold text-slate-800 dark:text-white">
                  {activeWaiter?.name}
                </span>
              </div>
              <ChevronDown className={`h-3 w-3 opacity-60 transition ${waiterOpen ? "rotate-180" : ""}`} />
            </button>

            {waiterOpen && (
              <div className="absolute right-0 mt-1.5 w-60 rounded-xl border border-slate-200 bg-white p-2 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 z-50 animate-in fade-in slide-in-from-top-1">
                <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  Switch Active Waiter
                </div>
                <div className="space-y-1">
                  {waiters.map((w) => (
                    <button
                      key={w.id}
                      onClick={() => handleWaiterSelect(w.id)}
                      className={`flex w-full items-center justify-between rounded-lg p-2 text-xs transition ${
                        w.id === activeWaiter?.id
                          ? "bg-emerald-500/10 font-bold text-emerald-600 dark:text-emerald-400"
                          : "hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{w.avatar}</span>
                        <div className="text-left">
                          <span className="block font-semibold">{w.name}</span>
                          <span className="block text-[10px] text-slate-400">PIN: {w.pin}</span>
                        </div>
                      </div>
                      {w.id === activeWaiter?.id && <span className="text-emerald-600 font-bold">Active ✓</span>}
                    </button>
                  ))}
                </div>
                <div className="mt-2 border-t border-slate-100 pt-2 dark:border-zinc-800">
                  <Link
                    href="/waiter"
                    onClick={() => setWaiterOpen(false)}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-600 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition"
                  >
                    <Smartphone className="h-3.5 w-3.5" />
                    Open Waiter App View
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Database Status Indicator */}
          <div
            className={`hidden xl:flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold border ${
              dbStatus === "connected"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-400"
            }`}
            title={dbStatus === "connected" ? "MongoDB Atlas Connected" : "Local Sync Store (Set MONGODB_URI to connect live Atlas)"}
          >
            <Database className="h-3 w-3" />
            <span>{dbStatus === "connected" ? "MongoDB Live" : "MongoDB Ready"}</span>
          </div>

          {/* Language Selector */}
          <div className="relative" ref={langRef}>
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 transition"
              title="Change Language"
            >
              <Globe className="h-3.5 w-3.5 text-slate-500" />
              <span>{currentLang.native}</span>
              <ChevronDown className={`h-3.5 w-3.5 opacity-60 transition ${langOpen ? "rotate-180" : ""}`} />
            </button>

            {langOpen && (
              <ul className="absolute right-0 mt-1.5 w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 z-50">
                {LANGUAGES.map((lang) => (
                  <li key={lang.code}>
                    <button
                      onClick={() => changeLanguage(lang.code)}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition ${
                        lang.code === currentLang.code
                          ? "bg-emerald-500/10 font-bold text-emerald-600 dark:text-emerald-400"
                          : "hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{lang.flag}</span>
                        <span>{lang.native}</span>
                      </span>
                      {lang.code === currentLang.code && <span>✓</span>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition"
            title="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-600" />}
          </button>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 lg:hidden"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="border-t border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 lg:hidden animate-in slide-in-from-top-2">
          <nav className="flex flex-col gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between rounded-lg px-3.5 py-2.5 text-sm font-semibold transition ${
                    isActive
                      ? item.highlight
                        ? "bg-amber-500 text-white"
                        : "bg-emerald-600 text-white font-bold"
                      : "text-slate-700 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.highlight && <span className="rounded bg-white/20 px-1.5 py-0.5 text-[10px]">FAST</span>}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
