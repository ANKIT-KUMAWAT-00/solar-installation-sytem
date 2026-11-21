"use client";

import React, { useEffect, useState } from "react";
import {
  ShoppingBag,
  CreditCard,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Truck
} from "lucide-react";
import { api } from "@/lib/api";

interface OrdersModuleProps {
  onDispatchOrder?: (orderId: number) => void;
  onRecordPayment?: (orderId: number) => void;
}

export default function OrdersModule({ onDispatchOrder, onRecordPayment }: OrdersModuleProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [overrideReason, setOverrideReason] = useState("");

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await api.getOrders();
      setOrders(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenOverride = (id: number) => {
    setSelectedOrderId(id);
    setOverrideReason("");
    setOverrideModalOpen(true);
  };

  const handleSubmitOverride = async () => {
    if (!selectedOrderId || !overrideReason.trim()) return;
    try {
      await api.creditOverride(selectedOrderId, overrideReason);
      alert("Credit override approved! Order is now released for warehouse dispatch.");
      setOverrideModalOpen(false);
      loadOrders();
    } catch (e: any) {
      alert(`Override error: ${e.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-white flex items-center gap-2.5">
          <ShoppingBag className="w-5 h-5 text-solar-emerald" /> Confirmed Orders & Dispatch Gate
        </h1>
        <p className="text-xs text-slate-400">
          Order fulfillment, milestone payment tracking, and automated warehouse dispatch authorization guard.
        </p>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {orders.map((o) => {
          const isReady = o.is_dispatch_ready;
          const advancePct = Math.min(100, Math.round((o.advance_paid / max(1, o.total_amount)) * 100));

          return (
            <div
              key={o.id}
              className="glass-panel glass-panel-hover p-4 rounded-2xl border border-solar-border/80 flex flex-col justify-between space-y-3 transition-all"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-solar-emerald">{o.order_number}</span>
                    <h3 className="text-sm font-bold text-white">{o.customer_name}</h3>
                    <p className="text-xs text-slate-400">{o.customer_city}</p>
                  </div>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${
                      o.status === "COMPLETED"
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        : o.status === "DISPATCHED"
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                        : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                    }`}
                  >
                    {o.status}
                  </span>
                </div>

                <div className="mt-3 p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">System:</span>
                    <span className="text-white font-bold">{o.system_capacity_kw} kW {o.system_type.replace("_", " ")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Order Value:</span>
                    <span className="font-mono text-solar-gold font-bold">₹{o.total_amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[11px] pt-1 border-t border-slate-800">
                    <span className="text-slate-400">Advance Paid:</span>
                    <span className="font-mono text-emerald-400 font-bold">₹{o.advance_paid.toLocaleString()} ({advancePct}%)</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Remaining Balance:</span>
                    <span className="font-mono text-slate-300">₹{o.remaining_balance.toLocaleString()}</span>
                  </div>
                </div>

                {/* Dispatch Gate Status */}
                <div className="mt-3">
                  {isReady ? (
                    <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-xs">
                      <Unlock className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <div className="text-[11px] text-emerald-300">
                        <strong>DISPATCH AUTHORIZED</strong>
                        {o.credit_override_reason && (
                          <div className="text-[10px] text-slate-400 italic">Credit Override: "{o.credit_override_reason}"</div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-rose-300 text-[11px]">
                        <Lock className="w-4 h-4 text-rose-400 flex-shrink-0" />
                        <span>Dispatch Blocked (Awaiting 30% Advance)</span>
                      </div>
                      <button
                        onClick={() => handleOpenOverride(o.id)}
                        className="text-[10px] text-amber-400 hover:underline font-bold"
                      >
                        Override
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => onRecordPayment?.(o.id)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-1.5"
                >
                  <CreditCard className="w-3.5 h-3.5 text-solar-emerald" /> + Payment
                </button>

                {isReady && o.status !== "COMPLETED" && o.status !== "DISPATCHED" && (
                  <button
                    onClick={() => onDispatchOrder?.(o.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-solar-gold hover:bg-amber-400 text-slate-950 shadow-solar-gold transition-all flex items-center gap-1.5"
                  >
                    <Truck className="w-3.5 h-3.5" /> Dispatch Warehouse
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Credit Override Modal */}
      {overrideModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-solar-border shadow-2xl p-5 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-solar-gold" /> Manager Dispatch Credit Override
            </h3>
            <p className="text-xs text-slate-400">
              This order has not met the mandatory 30% advance payment requirement. An authorized Director or Finance Executive must enter an official justification to release materials for warehouse dispatch:
            </p>
            <textarea
              rows={3}
              required
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              placeholder="e.g. Verified customer post-dated cheque #401929 deposited in HDFC Bank."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setOverrideModalOpen(false)} className="px-3 py-1.5 text-xs text-slate-400">
                Cancel
              </button>
              <button
                disabled={!overrideReason.trim()}
                onClick={handleSubmitOverride}
                className="px-4 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl shadow-solar-gold disabled:opacity-50"
              >
                Release Dispatch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function max(a: number, b: number) {
  return a > b ? a : b;
}
