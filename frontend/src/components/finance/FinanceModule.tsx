"use client";

import React, { useState, useEffect } from "react";
import {
  DollarSign,
  TrendingUp,
  Download,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  PieChart as PieChartIcon,
  ArrowUpRight,
  ArrowDownRight,
  Briefcase,
  Layers
} from "lucide-react";
import { api } from "@/lib/api";

export default function FinanceModule() {
  const [jobRecords, setJobRecords] = useState<any[]>([]);
  const [overview, setOverview] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"margin" | "profit" | "revenue">("profit");

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const fetchFinanceData = async () => {
    setLoading(true);
    try {
      const [jobs, ov] = await Promise.all([
        api.getJobProfitability(),
        api.getFinancialOverview(),
      ]);
      setJobRecords(jobs || []);
      setOverview(ov || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const token = api.getToken();
      const res = await fetch("http://localhost:8000/api/reports/export-csv?report_type=profitability", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed to export CSV");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "SunPower_Job_Profitability_Report.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      alert("CSV export error: " + err.message);
    }
  };

  const filtered = jobRecords
    .filter((j) => {
      const matchesSearch =
        j.order_number.toLowerCase().includes(search.toLowerCase()) ||
        j.customer_name.toLowerCase().includes(search.toLowerCase()) ||
        j.city.toLowerCase().includes(search.toLowerCase());
      return matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === "margin") return b.gross_margin_pct - a.gross_margin_pct;
      if (sortBy === "profit") return b.gross_profit_inr - a.gross_profit_inr;
      return b.revenue_inr - a.revenue_inr;
    });

  const totalRevenue = jobRecords.reduce((acc, j) => acc + (j.revenue_inr || 0), 0);
  const totalCost = jobRecords.reduce((acc, j) => acc + (j.total_cost_inr || 0), 0);
  const totalMaterial = jobRecords.reduce((acc, j) => acc + (j.material_cost_inr || 0), 0);
  const totalLabour = jobRecords.reduce((acc, j) => acc + (j.labour_cost_inr || 0), 0);
  const totalProfit = totalRevenue - totalCost;
  const avgMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Job-Wise Profitability Engine &amp; Financial P&amp;L
              </h1>
              <p className="text-sm text-slate-400">
                Formula: Revenue - (BOM Material + Technician Labour + Freight/DISCOM Costs) = Real Gross Profit &amp; Margin %
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
          >
            <Download className="w-4 h-4" />
            Export Profitability CSV
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400">Total Project Revenue</span>
          <div className="text-xl font-bold text-white mt-1 font-mono">
            ₹{totalRevenue.toLocaleString()}
          </div>
          <span className="text-[11px] text-emerald-400 flex items-center gap-1 mt-0.5">
            <ArrowUpRight className="w-3 h-3" /> Across {jobRecords.length} jobs
          </span>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-amber-400">BOM Material Costs</span>
          <div className="text-xl font-bold text-amber-400 mt-1 font-mono">
            ₹{totalMaterial.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500">Panels, Inverters, ACDB</span>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-blue-400">Technician Labour</span>
          <div className="text-xl font-bold text-blue-400 mt-1 font-mono">
            ₹{totalLabour.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500">Field Crew Payout</span>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-emerald-400">Net Gross Profit</span>
          <div className="text-xl font-bold text-emerald-400 mt-1 font-mono">
            ₹{totalProfit.toLocaleString()}
          </div>
          <span className="text-[11px] text-emerald-400/80">Retained Earnings</span>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-cyan-400">Avg Gross Margin</span>
          <div className="text-xl font-bold text-cyan-400 mt-1 font-mono">{avgMargin}%</div>
          <span className="text-[11px] text-cyan-400/80">Target: &gt; 35.0%</span>
        </div>
      </div>

      {/* Profitability Table */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden space-y-4 p-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by order number, customer, city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Sort by:</span>
            <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs">
              <button
                onClick={() => setSortBy("profit")}
                className={`px-3 py-1 rounded transition-colors ${
                  sortBy === "profit" ? "bg-emerald-600 text-white font-medium" : "text-slate-400 hover:text-slate-300"
                }`}
              >
                Profit (₹)
              </button>
              <button
                onClick={() => setSortBy("margin")}
                className={`px-3 py-1 rounded transition-colors ${
                  sortBy === "margin" ? "bg-emerald-600 text-white font-medium" : "text-slate-400 hover:text-slate-300"
                }`}
              >
                Margin (%)
              </button>
              <button
                onClick={() => setSortBy("revenue")}
                className={`px-3 py-1 rounded transition-colors ${
                  sortBy === "revenue" ? "bg-emerald-600 text-white font-medium" : "text-slate-400 hover:text-slate-300"
                }`}
              >
                Revenue (₹)
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">Calculating job profitability...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400">No project records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Customer &amp; City</th>
                  <th className="py-3 px-4">System</th>
                  <th className="py-3 px-4 text-right">Revenue (₹)</th>
                  <th className="py-3 px-4 text-right">Material (₹)</th>
                  <th className="py-3 px-4 text-right">Labour (₹)</th>
                  <th className="py-3 px-4 text-right">Other (₹)</th>
                  <th className="py-3 px-4 text-right">Total Cost (₹)</th>
                  <th className="py-3 px-4 text-right">Gross Profit (₹)</th>
                  <th className="py-3 px-4 text-right">Margin %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filtered.map((j) => {
                  const isHealthy = j.gross_margin_pct >= 35.0;
                  return (
                    <tr key={j.order_id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-semibold text-white">
                        {j.order_number}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-white block">{j.customer_name}</span>
                        <span className="text-[11px] text-slate-400">{j.city}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-200 block">
                          {j.capacity_kw} kW
                        </span>
                        <span className="text-[10px] text-slate-500">{j.system_type}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-white">
                        ₹{j.revenue_inr?.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-amber-400">
                        ₹{j.material_cost_inr?.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-blue-400">
                        ₹{j.labour_cost_inr?.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-400">
                        ₹{j.other_cost_inr?.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                        ₹{j.total_cost_inr?.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">
                        ₹{j.gross_profit_inr?.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full font-mono font-bold text-[11px] ${
                            isHealthy
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          }`}
                        >
                          {j.gross_margin_pct}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
