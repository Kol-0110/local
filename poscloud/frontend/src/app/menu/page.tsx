"use client";

import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";
import {
  BookOpen,
  Plus,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
  X,
  DollarSign,
  TrendingUp,
  Sun,
  Moon,
  Bell,
  Menu as MenuIcon,
  Layers,
  Percent,
  Check,
} from "lucide-react";
import {
  usePOSStore,
  MenuItem,
  toggleMenuItemAvailability,
  addMenuItem,
} from "@/lib/store";
import Sidebar from "@/components/Sidebar";

export default function MenuPage() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { menu } = usePOSStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New item form
  const [newName, setNewName] = useState("");
  const [newNameAm, setNewNameAm] = useState("");
  const [newCategory, setNewCategory] = useState<
    "Traditional" | "Main Dishes" | "Drinks & Coffee" | "Fast Food" | "Sides"
  >("Traditional");
  const [newPrice, setNewPrice] = useState<number>(250);
  const [newCost, setNewCost] = useState<number>(100);
  const [newDesc, setNewDesc] = useState("");
  const [newPrepTime, setNewPrepTime] = useState<number>(12);

  const categories = useMemo(() => {
    const set = Array.from(new Set(menu.map((m) => m.category)));
    return ["All", ...set];
  }, [menu]);

  const filteredMenu = useMemo(() => {
    return menu.filter((item) => {
      const matchCat = selectedCategory === "All" || item.category === selectedCategory;
      const matchSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.nameAm && item.nameAm.includes(searchQuery)) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [menu, selectedCategory, searchQuery]);

  // Analytics summary for top cards
  const stats = useMemo(() => {
    const total = menu.length;
    const available = menu.filter((m) => m.isAvailable).length;
    const outOfStock = total - available;
    const avgMargin =
      total > 0
        ? Math.round(
            menu.reduce((acc, m) => {
              const cost = m.cost || Math.round(m.price * 0.4);
              const margin = ((m.price - cost) / m.price) * 100;
              return acc + margin;
            }, 0) / total
          )
        : 0;
    return { total, available, outOfStock, avgMargin };
  }, [menu]);

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || newPrice <= 0) return;

    addMenuItem({
      name: newName.trim(),
      nameAm: newNameAm.trim() || undefined,
      category: newCategory,
      price: newPrice,
      cost: newCost > 0 ? newCost : Math.round(newPrice * 0.4),
      description: newDesc.trim() || undefined,
      isAvailable: true,
      prepTimeMinutes: newPrepTime,
    });

    setIsAddModalOpen(false);
    setNewName("");
    setNewNameAm("");
    setNewDesc("");
  };

  const isAmharic = i18n.language === "am";

  return (
    <div className="min-h-screen bg-[#f4f6f8] dark:bg-[#0b0c0d] text-[#111418] dark:text-[#f2f3f4] flex flex-col lg:flex-row font-sans selection:bg-cyan-500/20 transition-colors duration-200">
      
      {/* 1. SHARED FINTRACK SIDEBAR */}
      <Sidebar mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />

      {/* 2. MOBILE TOPBAR */}
      <div className="lg:hidden flex items-center justify-between border-b border-[#e3e6ea] dark:border-[#232527] bg-white dark:bg-[#0f1011] px-4 py-3 sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-cyan-600 font-black text-[#04262d] text-xs">
            //
          </div>
          <span className="font-bold text-[#111418] dark:text-white text-base">Fintrack</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e3e6ea] dark:border-[#232527] bg-[#f1f3f5] dark:bg-[#1b1c1e] text-[#111418] dark:text-[#f2f3f4]"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
        </button>
      </div>

      {/* 3. MAIN CONTENT */}
      <main className="flex-1 flex flex-col p-4 sm:p-6 lg:p-7 space-y-6 max-w-[1500px] w-full overflow-y-auto">
        
        {/* Top Header Bar */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#111418] dark:text-[#f2f3f4]">
              Menu Catalog &amp; Costs
            </h1>
            <p className="text-xs text-[#5f6670] dark:text-[#8b8f94] mt-0.5">
              Live dish inventory, food unit costs, and profit margin analysis
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Search Input */}
            <div className="relative flex items-center bg-white dark:bg-[#141516] border border-[#e3e6ea] dark:border-[#232527] rounded-lg px-3 py-1.5 w-full sm:w-64 shadow-sm focus-within:border-cyan-600 transition duration-200">
              <Search className="h-4 w-4 text-[#9aa1a9] dark:text-[#5d6166] mr-2 shrink-0" />
              <input
                type="text"
                placeholder="Search dishes or ingredients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-xs text-[#111418] dark:text-[#f2f3f4] placeholder-[#9aa1a9] focus:outline-none"
              />
            </div>

            {/* Add Dish Button */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 rounded-lg bg-cyan-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-cyan-500 transition-all duration-200 hover:shadow-md hover:shadow-cyan-600/20 active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              <span>Add New Dish</span>
            </button>

            {/* Notification Bell */}
            <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e3e6ea] dark:border-[#232527] bg-white dark:bg-[#141516] text-[#5f6670] dark:text-[#8b8f94] hover:text-[#111418] dark:hover:text-white transition duration-200 shadow-sm hover:shadow">
              <Bell className="h-4 w-4" />
            </button>

            {/* Light / Dark Mode Toggle */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              title="Toggle Light / Dark mode"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e3e6ea] dark:border-[#232527] bg-white dark:bg-[#141516] text-[#5f6670] dark:text-[#8b8f94] hover:text-[#111418] dark:hover:text-white transition duration-200 shadow-sm hover:shadow"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-[#5f6670]" />
              )}
            </button>
          </div>
        </header>

        {/* 4 Summary KPI Cards with Cool Hover Lift */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-[#e3e6ea] dark:border-[#232527] bg-white dark:bg-[#141516] p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between text-[#5f6670] dark:text-[#8b8f94] text-xs font-medium">
              <span>Total Dishes</span>
              <BookOpen className="h-4 w-4 text-cyan-500" />
            </div>
            <div className="mt-2 text-2xl font-black text-[#111418] dark:text-[#f2f3f4]">
              {stats.total}
            </div>
            <div className="mt-1 text-[11px] text-[#9aa1a9]">Catalog size across sections</div>
          </div>

          <div className="rounded-2xl border border-[#e3e6ea] dark:border-[#232527] bg-white dark:bg-[#141516] p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 text-xs font-medium">
              <span>In Stock</span>
              <CheckCircle className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {stats.available}
            </div>
            <div className="mt-1 text-[11px] text-[#9aa1a9]">Ready for kitchen order dispatch</div>
          </div>

          <div className="rounded-2xl border border-[#e3e6ea] dark:border-[#232527] bg-white dark:bg-[#141516] p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 text-xs font-medium">
              <span>86'd / Out of Stock</span>
              <XCircle className="h-4 w-4 text-rose-500" />
            </div>
            <div className="mt-2 text-2xl font-black text-rose-600 dark:text-rose-400">
              {stats.outOfStock}
            </div>
            <div className="mt-1 text-[11px] text-[#9aa1a9]">Temporarily hidden from POS</div>
          </div>

          <div className="rounded-2xl border border-[#e3e6ea] dark:border-[#232527] bg-white dark:bg-[#141516] p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between text-cyan-600 dark:text-cyan-400 text-xs font-medium">
              <span>Average Margin</span>
              <TrendingUp className="h-4 w-4 text-cyan-500" />
            </div>
            <div className="mt-2 text-2xl font-black text-cyan-600 dark:text-cyan-400">
              {stats.avgMargin}%
            </div>
            <div className="mt-1 text-[11px] text-[#9aa1a9]">Healthy menu profitability target</div>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 ${
                  selectedCategory === cat
                    ? "bg-cyan-600 text-white shadow-sm font-bold"
                    : "bg-white dark:bg-[#141516] text-[#5f6670] dark:text-[#8b8f94] hover:text-[#111418] dark:hover:text-white border border-[#e3e6ea] dark:border-[#232527] hover:bg-[#f8f9fa] dark:hover:bg-[#18191b]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="text-xs text-[#5f6670] dark:text-[#8b8f94] font-medium">
            Showing <span className="font-bold text-[#111418] dark:text-white">{filteredMenu.length}</span> dishes
          </div>
        </div>

        {/* Menu Table Card */}
        <div className="overflow-hidden rounded-2xl border border-[#e3e6ea] dark:border-[#232527] bg-white dark:bg-[#141516] shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#e3e6ea] dark:border-[#232527] bg-[#f8f9fa] dark:bg-[#18191b] text-[11px] font-bold uppercase tracking-wider text-[#5f6670] dark:text-[#8b8f94]">
                <tr>
                  <th className="px-5 py-3.5">Dish / Item</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Selling Price</th>
                  <th className="px-5 py-3.5">Unit Cost</th>
                  <th className="px-5 py-3.5">Profit / Margin</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e3e6ea] dark:divide-[#232527] font-medium">
                {filteredMenu.map((item) => {
                  const cost = item.cost || Math.round(item.price * 0.4);
                  const profit = item.price - cost;
                  const margin = Math.round((profit / item.price) * 100);

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-[#f8f9fa] dark:hover:bg-[#1a1b1d] transition-colors duration-150 group"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#111418] dark:text-[#f2f3f4] group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                            {isAmharic && item.nameAm ? item.nameAm : item.name}
                          </span>
                          {item.popular && (
                            <span className="flex items-center gap-0.5 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 border border-amber-500/20">
                              <Sparkles className="h-2.5 w-2.5" />
                              Popular
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="mt-0.5 text-[11px] text-[#5f6670] dark:text-[#8b8f94] max-w-md line-clamp-1">
                            {item.description}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-lg bg-[#f1f3f5] dark:bg-[#1f2022] px-2.5 py-1 text-[11px] font-semibold text-[#5f6670] dark:text-[#8b8f94] border border-[#e3e6ea] dark:border-[#2b2d30]">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-black text-[#111418] dark:text-[#f2f3f4] text-sm">
                        {item.price.toLocaleString()} ETB
                      </td>
                      <td className="px-5 py-4 font-semibold text-rose-600 dark:text-rose-400">
                        {cost.toLocaleString()} ETB
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            +{profit} ETB
                          </span>
                          <span className="rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 px-1.5 py-0.5 text-[10px] font-black border border-emerald-200 dark:border-emerald-500/30">
                            {margin}%
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            item.isAvailable
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30"
                              : "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30"
                          }`}
                        >
                          {item.isAvailable ? (
                            <>
                              <CheckCircle className="h-3 w-3" />
                              In Stock
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3" />
                              Out of Stock
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => toggleMenuItemAvailability(item.id)}
                          className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all duration-200 ${
                            item.isAvailable
                              ? "border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                              : "border border-emerald-200 dark:border-emerald-900/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                          }`}
                        >
                          {item.isAvailable ? "Mark 86'd" : "Restock"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Item Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="w-full max-w-lg rounded-2xl border border-[#e3e6ea] dark:border-[#282a2d] bg-white dark:bg-[#18191b] p-6 shadow-2xl text-[#111418] dark:text-[#f2f3f4]">
              <div className="flex items-center justify-between border-b border-[#e3e6ea] dark:border-[#232527] pb-3">
                <h3 className="text-base font-bold text-[#111418] dark:text-white">
                  Add New Dish with Cost
                </h3>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1 text-[#5f6670] hover:text-[#111418] dark:text-[#8b8f94] dark:hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateItem} className="mt-4 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-[#5f6670] dark:text-[#8b8f94]">
                    Dish Name (English)
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Special Tibs"
                    className="mt-1 w-full rounded-xl border border-[#e3e6ea] dark:border-[#2b2d30] bg-[#f8f9fa] dark:bg-[#111213] px-3.5 py-2 text-xs text-[#111418] dark:text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#5f6670] dark:text-[#8b8f94]">
                    Dish Name (Amharic)
                  </label>
                  <input
                    type="text"
                    value={newNameAm}
                    onChange={(e) => setNewNameAm(e.target.value)}
                    placeholder="ምሳሌ፡ ልዩ ጥብስ"
                    className="mt-1 w-full rounded-xl border border-[#e3e6ea] dark:border-[#2b2d30] bg-[#f8f9fa] dark:bg-[#111213] px-3.5 py-2 text-xs text-[#111418] dark:text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-[#5f6670] dark:text-[#8b8f94]">
                      Selling Price (ETB)
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={newPrice}
                      onChange={(e) => setNewPrice(Number(e.target.value))}
                      className="mt-1 w-full rounded-xl border border-[#e3e6ea] dark:border-[#2b2d30] bg-[#f8f9fa] dark:bg-[#111213] px-3.5 py-2 text-xs text-[#111418] dark:text-white font-bold focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#5f6670] dark:text-[#8b8f94]">
                      Ingredient Cost (ETB)
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={newCost}
                      onChange={(e) => setNewCost(Number(e.target.value))}
                      className="mt-1 w-full rounded-xl border border-[#e3e6ea] dark:border-[#2b2d30] bg-[#f8f9fa] dark:bg-[#111213] px-3.5 py-2 text-xs text-rose-600 dark:text-rose-400 font-bold focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#f8f9fa] dark:bg-[#111213] border border-[#e3e6ea] dark:border-[#232527] flex items-center justify-between text-xs">
                  <span className="text-[#5f6670] dark:text-[#8b8f94]">Estimated Gross Profit:</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400">
                    +{Math.max(0, newPrice - newCost)} ETB ({newPrice > 0 ? Math.round(((newPrice - newCost) / newPrice) * 100) : 0}% Margin)
                  </span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#5f6670] dark:text-[#8b8f94]">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e: any) => setNewCategory(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#e3e6ea] dark:border-[#2b2d30] bg-[#f8f9fa] dark:bg-[#111213] px-3.5 py-2 text-xs text-[#111418] dark:text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="Traditional">Traditional</option>
                    <option value="Main Dishes">Main Dishes</option>
                    <option value="Drinks & Coffee">Drinks & Coffee</option>
                    <option value="Fast Food">Fast Food</option>
                    <option value="Sides">Sides</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="rounded-xl px-4 py-2 text-xs font-semibold text-[#5f6670] dark:text-[#8b8f94] hover:text-[#111418] dark:hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-cyan-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-cyan-500 transition active:scale-[0.98]"
                  >
                    Save Dish &amp; Cost
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
