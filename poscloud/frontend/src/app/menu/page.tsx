"use client";

import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
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
} from "lucide-react";
import {
  usePOSStore,
  MenuItem,
  toggleMenuItemAvailability,
  addMenuItem,
} from "@/lib/store";

export default function MenuPage() {
  const { t, i18n } = useTranslation();
  const { menu } = usePOSStore();

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
    <div className="flex-1 bg-slate-950 p-4 sm:p-6 lg:p-8 text-slate-100 min-h-screen">
      <div className="mx-auto max-w-7xl space-y-6">
        
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white">
                Menu Catalog & Profit Margins
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                Manage selling prices, ingredient costs, and track profit per dish
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-950 hover:bg-emerald-500 transition active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Dish & Cost</span>
          </button>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes or ingredients..."
              className="w-full rounded-xl border border-slate-800 bg-slate-900 pl-10 pr-4 py-2 text-xs sm:text-sm font-medium text-white focus:border-emerald-500 focus:outline-none placeholder-slate-500"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                  selectedCategory === cat
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-slate-900 text-slate-400 hover:bg-slate-800"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
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
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredMenu.map((item) => {
                  const cost = item.cost || Math.round(item.price * 0.4);
                  const profit = item.price - cost;
                  const margin = Math.round((profit / item.price) * 100);

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-800/40 transition"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">
                            {isAmharic && item.nameAm ? item.nameAm : item.name}
                          </span>
                          {item.popular && (
                            <span className="flex items-center gap-0.5 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/20">
                              <Sparkles className="h-2.5 w-2.5" />
                              Popular
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="mt-0.5 text-[11px] text-slate-400 max-w-md line-clamp-1">
                            {item.description}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-lg bg-slate-800 px-2 py-1 text-[11px] font-semibold text-slate-300">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-black text-white text-sm">
                        {item.price.toLocaleString()} ETB
                      </td>
                      <td className="px-5 py-4 font-semibold text-rose-300">
                        {cost.toLocaleString()} ETB
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-emerald-400">+{profit} ETB</span>
                          <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-black text-emerald-400 border border-emerald-500/30">
                            {margin}%
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            item.isAvailable
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                              : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
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
                          className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                            item.isAvailable
                              ? "border border-rose-800/80 text-rose-400 hover:bg-rose-950/40"
                              : "border border-emerald-800/80 text-emerald-400 hover:bg-emerald-950/40"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl text-slate-100">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white">
                  Add New Dish with Cost
                </h3>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateItem} className="mt-4 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300">
                    Dish Name (English)
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Special Tibs"
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300">
                    Dish Name (Amharic)
                  </label>
                  <input
                    type="text"
                    value={newNameAm}
                    onChange={(e) => setNewNameAm(e.target.value)}
                    placeholder="ምሳሌ፡ ልዩ ጥብስ"
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300">
                      Selling Price (ETB)
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={newPrice}
                      onChange={(e) => setNewPrice(Number(e.target.value))}
                      className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs text-white font-bold focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300">
                      Ingredient Cost (ETB)
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={newCost}
                      onChange={(e) => setNewCost(Number(e.target.value))}
                      className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs text-rose-300 font-bold focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Estimated Gross Profit:</span>
                  <span className="font-black text-emerald-400">
                    +{Math.max(0, newPrice - newCost)} ETB ({newPrice > 0 ? Math.round(((newPrice - newCost) / newPrice) * 100) : 0}% Margin)
                  </span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e: any) => setNewCategory(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
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
                    className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-emerald-950 hover:bg-emerald-500 transition"
                  >
                    Save Dish & Cost
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
