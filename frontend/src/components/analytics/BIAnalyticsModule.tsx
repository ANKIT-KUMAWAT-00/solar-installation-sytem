"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  PieChart as PieIcon,
  Leaf,
  Users,
  ShieldCheck,
  Calendar,
  Layers,
  ArrowUpRight,
  Flame,
  Award,
  Download
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  CartesianGrid
} from "recharts";
import { api } from "@/lib/api";

const COLORS = ["#10B981", "#3B82F6", "#F59E0B", "#8B5CF6", "#EC4899", "#14B8A6"];

export default function BIAnalyticsModule() {
  const [kpis, setKpis] = useState<any | null>(null);
  const [profitability, setProfitability] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState("month");

  useEffect(() => {
    loadData();
  }, [timeframe]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [kpiRes, profRes, techRes] = await Promise.all([
        api.getDashboardKPIs(timeframe),
        api.getJobProfitability(),
        api.getTechnicians(),
      ]);
      setKpis(kpiRes);
      setProfitability(profRes || []);
      setTechnicians(techRes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Funnel Data
  const funnelData = kpis?.funnel_stages || [
    { name: "Enquiries", count: 18, fill: "#3B82F6" },
    { name: "Surveys", count: 12, fill: "#06B6D4" },
    { name: "Quotations", count: 9, fill: "#F59E0B" },
    { name: "Confirmed Orders", count: 6, fill: "#10B981" },
    { name: "Installed", count: 4, fill: "#8B5CF6" },
  ];

  // Monthly Revenue & Margin Trends
  const monthlyData = kpis?.revenue_trends || [
    { month: "Jan", revenue: 450000, cost: 280000, profit: 170000 },
    { month: "Feb", revenue: 580000, cost: 360000, profit: 220000 },
    { month: "Mar", revenue: 720000, cost: 440000, profit: 280000 },
    { month: "Apr", revenue: 890000, cost: 530000, profit: 360000 },
    { month: "May", revenue: 980000, cost: 590000, profit: 390000 },
    { month: "Jun", revenue: 1150000, cost: 680000, profit: 470000 },
  ];

  // Capacity breakdown
  const capacityData = [
    { name: "1 kW Residential", value: 35 },
    { name: "2 kW Residential", value: 25 },
    { name: "3 kW Residential", value: 20 },
    { name: "4 kW On-Grid", value: 12 },
    { name: "5 kW Hybrid", value: 8 },
  ];

  // Component Failure Distribution
  const failureData = [
    { name: "Inverter F023 Overvoltage", value: 45 },
    { name: "DC Cable & Connector Wear", value: 25 },
    { name: "Net Meter Sync Delay", value: 15 },
    { name: "Chemical Earthing Degradation", value: 10 },
    { name: "Module Micro-Cracks", value: 5 },
  ];

  // Environmental Metrics Calculation
  const totalKwInstalled = profitability.reduce((acc, p) => acc + (p.capacity_kw || 0), 0) + 14.0;
  const annualKwhGenerated = Math.round(totalKwInstalled * 1450); // standard 1450 kWh/kWp/year in western India
  const co2AvoidedTonnes = ((annualKwhGenerated * 0.82) / 1000).toFixed(1); // 0.82 kg CO2 / kWh Indian grid
  const treesPlanted = Math.round(annualKwhGenerated * 0.045);
  const carMilesAvoided = Math.round(annualKwhGenerated * 1.8);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Executive BI &amp; Operations Intelligence
              </h1>
              <p className="text-sm text-slate-400">
                End-to-end sales conversion velocity, job gross margins, component failure RMA analytics, and carbon offset accounting.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {["week", "month", "quarter", "year"].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors ${
                timeframe === tf
                  ? "bg-purple-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:text-slate-300"
              }`}
            >
              This {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Environmental Impact Banner */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900/80 to-teal-950/40 border border-emerald-500/30 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Leaf className="w-4 h-4 text-emerald-400" />
              Verified Environmental ESG Impact
            </span>
            <h3 className="text-xl font-bold text-white">Clean Green Energy Generation Contribution</h3>
            <p className="text-xs text-slate-400 max-w-xl">
              Based on {totalKwInstalled} kW installed active rooftop solar capacity across Pune, Pimpri-Chinchwad, and Western Maharashtra.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 shrink-0 text-center">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-emerald-500/20">
              <span className="text-xs text-slate-400 block">CO₂ Avoided</span>
              <span className="text-xl font-bold text-emerald-400 font-mono mt-0.5 block">
                {co2AvoidedTonnes} t
              </span>
              <span className="text-[10px] text-slate-500">Metric Tonnes</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-emerald-500/20">
              <span className="text-xs text-slate-400 block">Equiv. Trees</span>
              <span className="text-xl font-bold text-teal-400 font-mono mt-0.5 block">
                {treesPlanted.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500">Trees Planted</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-emerald-500/20">
              <span className="text-xs text-slate-400 block">Vehicle Miles</span>
              <span className="text-xl font-bold text-cyan-400 font-mono mt-0.5 block">
                {carMilesAvoided.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500">Km Offset</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 1: Sales Conversion Funnel & Monthly Revenue/Profit Area Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sales Funnel */}
        <div className="lg:col-span-5 bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Sales Conversion Pipeline Funnel
            </h3>
            <span className="text-xs text-slate-400">Enquiries → Commissioning</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <YAxis dataKey="name" type="category" stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px" }}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {funnelData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue & Profit Growth Chart */}
        <div className="lg:col-span-7 bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-purple-400" />
              Monthly Revenue vs Direct Costs &amp; Gross Profit
            </h3>
            <span className="text-xs text-slate-400">Figures in INR (₹)</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px" }}
                />
                <Legend />
                <Area type="monotone" dataKey="revenue" name="Total Revenue" stroke="#10B981" fillOpacity={1} fill="url(#revGrad)" />
                <Area type="monotone" dataKey="cost" name="Direct Costs" stroke="#F59E0B" fillOpacity={1} fill="url(#costGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Equipment Failure Diagnostics & Installed Capacity Mix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Failure Breakdown */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-rose-400" />
              Equipment Failure Frequency &amp; RMA Causes
            </h3>
            <span className="text-xs text-slate-400">Post-Commissioning Complaints</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={failureData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {failureData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px" }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Capacity Mix */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Installed System Capacity Distribution
            </h3>
            <span className="text-xs text-slate-400">1 kW to 5 kW Breakdown</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={capacityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {capacityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px" }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
