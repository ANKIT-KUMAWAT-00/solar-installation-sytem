"use client";

import React, { useEffect, useState } from "react";
import {
  FileSpreadsheet,
  Download,
  CheckCircle2,
  Clock,
  Printer,
  ArrowRight,
  ShieldAlert,
  Percent,
  Receipt
} from "lucide-react";
import { api } from "@/lib/api";

interface QuotationsModuleProps {
  onViewOrder?: (orderId: number) => void;
}

export default function QuotationsModule({ onViewOrder }: QuotationsModuleProps) {
  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuote, setSelectedQuote] = useState<any | null>(null);

  useEffect(() => {
    loadQuotations();
  }, []);

  const loadQuotations = async () => {
    try {
      setLoading(true);
      const res = await api.getQuotations();
      setQuotations(res);
      if (res.length > 0 && !selectedQuote) {
        const detail = await api.getQuotationDetail(res[0].id);
        setSelectedQuote(detail);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectQuote = async (id: number) => {
    try {
      const detail = await api.getQuotationDetail(id);
      setSelectedQuote(detail);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAcceptQuotation = async (id: number) => {
    if (!confirm("Confirm customer acceptance? This will automatically convert this quotation to a Confirmed Order and reserve warehouse inventory.")) {
      return;
    }
    try {
      const res = await api.acceptQuotation(id);
      alert(res.message);
      loadQuotations();
      const updated = await api.getQuotationDetail(id);
      setSelectedQuote(updated);
    } catch (e: any) {
      alert(`Acceptance error: ${e.message}`);
    }
  };

  const downloadPdf = (id: number, quoteNum: string) => {
    window.open(`http://localhost:8000/api/quotations/${id}/pdf`, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-white flex items-center gap-2.5">
          <FileSpreadsheet className="w-5 h-5 text-solar-emerald" /> Quotations & Order Conversion Engine
        </h1>
        <p className="text-xs text-slate-400">
          Automated quotation generation from approved site surveys with GST calculation, advance payment requirements & order conversion.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Quotations List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            Quotations Pipeline ({quotations.length})
          </div>

          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            {quotations.map((q) => {
              const isSelected = selectedQuote?.id === q.id;
              const isAccepted = q.status === "ACCEPTED";

              return (
                <div
                  key={q.id}
                  onClick={() => handleSelectQuote(q.id)}
                  className={`glass-panel p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? "border-solar-emerald/80 bg-slate-900/90 shadow-solar-emerald"
                      : "border-solar-border/80 hover:border-slate-600"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-solar-emerald">{q.quotation_number}</span>
                      <h3 className="text-sm font-bold text-white">{q.customer_name}</h3>
                      <p className="text-xs text-slate-400">{q.system_capacity_kw} kW {q.system_type.replace("_", " ")}</p>
                    </div>

                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${
                        isAccepted
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                          : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                      }`}
                    >
                      {q.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-300 mt-2.5 pt-2 border-t border-slate-800">
                    <span className="text-solar-gold font-bold font-mono">₹{q.total_amount.toLocaleString()}</span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Advance Req: ₹{q.advance_required_amount.toLocaleString()} (30%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Quotation Viewer (7 cols) */}
        <div className="lg:col-span-7">
          {selectedQuote ? (
            <div className="glass-panel p-5 rounded-2xl border border-solar-border/80 space-y-5">
              {/* Top Meta & Action Bar */}
              <div className="flex items-start justify-between pb-3 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-solar-emerald font-bold">
                      {selectedQuote.quotation_number}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase ${
                        selectedQuote.status === "ACCEPTED"
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                          : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                      }`}
                    >
                      {selectedQuote.status}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-white mt-1">
                    {selectedQuote.customer?.name}
                  </h2>
                  <p className="text-xs text-slate-400">{selectedQuote.customer?.address}, {selectedQuote.customer?.city} • {selectedQuote.customer?.phone}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => downloadPdf(selectedQuote.id, selectedQuote.quotation_number)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5 text-solar-emerald" /> Download PDF
                  </button>

                  {selectedQuote.status !== "ACCEPTED" ? (
                    <button
                      onClick={() => handleAcceptQuotation(selectedQuote.id)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-solar-emerald hover:bg-emerald-400 text-slate-950 flex items-center gap-1.5 shadow-solar-emerald transition-all"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Accept & Convert to Order
                    </button>
                  ) : (
                    <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      ✓ Order Created & Inventory Reserved
                    </span>
                  )}
                </div>
              </div>

              {/* Package Summary Box */}
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400 font-mono">SELECTED SOLAR PACKAGE</div>
                  <div className="text-sm font-bold text-white mt-0.5">{selectedQuote.package?.name}</div>
                  <div className="text-xs text-solar-emerald font-semibold">{selectedQuote.system_capacity_kw} kW • {selectedQuote.system_type.replace("_", " ")}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 font-mono">TOTAL TURNKEY VALUE</div>
                  <div className="text-xl font-extrabold text-solar-gold font-mono">₹{selectedQuote.total_amount.toLocaleString()}</div>
                </div>
              </div>

              {/* Items Breakdown Table */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 mb-2">Automated BOM Components & Workmanship</h4>
                <div className="rounded-xl border border-slate-800 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="py-2 px-3">Description</th>
                        <th className="py-2 px-3 text-right">Qty</th>
                        <th className="py-2 px-3 text-right">Unit Price</th>
                        <th className="py-2 px-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {selectedQuote.items?.map((item: any) => (
                        <tr key={item.id} className="hover:bg-slate-800/20">
                          <td className="py-2 px-3 text-white font-medium">{item.item_name}</td>
                          <td className="py-2 px-3 text-right font-bold text-solar-emerald">{item.quantity}</td>
                          <td className="py-2 px-3 text-right text-slate-400 font-mono">₹{item.unit_price.toLocaleString()}</td>
                          <td className="py-2 px-3 text-right font-bold text-white font-mono">₹{item.total_price.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Summary Breakdown */}
              <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Hardware Subtotal:</span>
                  <span className="font-mono text-white">₹{selectedQuote.hardware_cost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Installation & Commissioning Labour:</span>
                  <span className="font-mono text-white">₹{selectedQuote.installation_labour_cost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>DC/AC Cabling & Protection Switchgear:</span>
                  <span className="font-mono text-white">₹{selectedQuote.accessories_cost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800">
                  <span>Goods & Services Tax (GST 12%):</span>
                  <span className="font-mono text-solar-emerald font-semibold">+₹{selectedQuote.tax_amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-200 font-bold text-sm pt-1 border-t border-slate-700">
                  <span>Final Turnkey Total:</span>
                  <span className="font-mono text-solar-gold">₹{selectedQuote.total_amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 font-bold text-xs mt-1">
                  <span>Mandatory Advance Required for Dispatch (30%):</span>
                  <span className="font-mono">₹{selectedQuote.advance_required_amount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel p-10 rounded-2xl border border-solar-border/80 flex items-center justify-center text-slate-400 text-xs">
              Select a quotation to view complete itemized breakdown.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
