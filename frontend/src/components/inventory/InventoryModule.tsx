"use client";

import React, { useEffect, useState } from "react";
import {
  Warehouse,
  Plus,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  PackageCheck,
  CheckCircle2,
  Box
} from "lucide-react";
import { api } from "@/lib/api";

export default function InventoryModule() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [search, setSearch] = useState("");
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [adjustQty, setAdjustQty] = useState(10);
  const [adjustNotes, setAdjustNotes] = useState("Purchase Order Received from Supplier");

  useEffect(() => {
    loadInventory();
  }, [lowStockFilter]);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const res = await api.getInventory(lowStockFilter);
      setItems(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdjust = (prod: any) => {
    setSelectedProduct(prod);
    setAdjustQty(10);
    setAdjustNotes("Purchase Order Received from Supplier");
    setAdjustModalOpen(true);
  };

  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    try {
      await api.adjustStock({
        product_id: selectedProduct.id,
        quantity: Number(adjustQty),
        transaction_type: "PURCHASE_RECEIPT",
        notes: adjustNotes,
      });
      setAdjustModalOpen(false);
      loadInventory();
      alert("Stock successfully updated in warehouse database!");
    } catch (e: any) {
      alert(`Adjustment error: ${e.message}`);
    }
  };

  const totalValuation = items.reduce(
    (acc, item) => acc + (item.physical_quantity || 0) * (item.unit_purchase_cost || 0),
    0
  );

  const lowStockCount = items.filter(
    (i) => (i.available_quantity || 0) <= (i.min_stock_threshold || 5)
  ).length;

  return (
    <div className="space-y-6">
      {/* Header & Stats Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2.5">
            <Warehouse className="w-5 h-5 text-solar-emerald" /> Warehouse & High-Value Equipment Inventory
          </h1>
          <p className="text-xs text-slate-400">
            Real-time physical vs reserved vs available inventory tracking: Available = Physical - Reserved.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-right">
            <div className="text-[10px] text-slate-400">Total Warehouse Valuation</div>
            <div className="text-sm font-extrabold text-solar-gold font-mono">
              ₹{totalValuation.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setLowStockFilter(false)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              !lowStockFilter
                ? "bg-solar-emerald text-slate-950 font-bold"
                : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            All Equipment ({items.length})
          </button>
          <button
            onClick={() => setLowStockFilter(true)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              lowStockFilter
                ? "bg-rose-500 text-white font-bold"
                : "bg-slate-900 border border-slate-800 text-rose-400 hover:text-rose-300"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" /> Low Stock Alerts ({lowStockCount})
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="glass-panel rounded-2xl border border-solar-border/80 overflow-hidden shadow-solar-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">SKU / Product Name</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3 text-right">Unit Purchase</th>
                <th className="py-3 px-3 text-right">Physical Stock</th>
                <th className="py-3 px-3 text-right">Reserved (Orders)</th>
                <th className="py-3 px-3 text-right">Available Stock</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {items.map((prod) => {
                const phys = prod.physical_quantity || 0;
                const res = prod.reserved_quantity || 0;
                const avail = prod.available_quantity || 0;
                const isLow = avail <= prod.min_stock_threshold;

                return (
                  <tr key={prod.id} className="hover:bg-slate-800/25 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-mono text-[10px] text-solar-emerald font-semibold">{prod.sku}</div>
                      <div className="font-bold text-white text-xs mt-0.5">{prod.name}</div>
                      <div className="text-[11px] text-slate-400">{prod.manufacturer} • {prod.model}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 text-[10px]">
                        {prod.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-300">
                      ₹{prod.unit_purchase_cost?.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-white">
                      {phys} {prod.unit}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-amber-400 font-semibold">
                      {res} {prod.unit}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-base font-extrabold text-solar-emerald">
                      {avail} {prod.unit}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {isLow ? (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold inline-flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Reorder
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                          Optimal
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenAdjust(prod)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
                      >
                        + Add Stock
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Goods Receipt / Adjust Modal */}
      {adjustModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-solar-border shadow-2xl p-5 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-solar-emerald" /> Goods Receipt / Add Inventory
            </h3>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
              <div className="text-[10px] text-solar-emerald font-mono">{selectedProduct.sku}</div>
              <div className="font-bold text-white">{selectedProduct.name}</div>
            </div>

            <form onSubmit={handleSaveAdjustment} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-medium">Quantity to Add *</label>
                <input
                  required
                  type="number"
                  min="1"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white mt-1"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium">Reference / Supplier Invoice Notes</label>
                <input
                  required
                  type="text"
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white mt-1"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setAdjustModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold bg-solar-emerald hover:bg-emerald-400 text-slate-950 rounded-xl shadow-solar-emerald"
                >
                  Confirm Goods Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
