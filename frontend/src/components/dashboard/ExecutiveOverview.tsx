"use client";

import React, { useEffect, useState } from "react";
import {
  FileText,
  Clock,
  FileCheck,
  CheckCircle,
  Wrench,
  Award,
  CircleDollarSign,
  CreditCard,
  Warehouse,
  Headphones,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Sparkles,
  Zap
} from "lucide-react";
import { api } from "@/lib/api";
import RooftopSolar3D from "@/components/3d/RooftopSolar3D";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface ExecutiveOverviewProps {
  onNavigate?: (tab: string) => void;
  onNavigateTab?: (tab: string) => void;
}

export default function ExecutiveOverview({ onNavigate, onNavigateTab }: ExecutiveOverviewProps) {
  const navigate = onNavigateTab || onNavigate || (() => {});
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState("month");

  useEffect(() => {
    loadKPIs();
  }, [timeframe]);

  const loadKPIs = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboardKPIs(timeframe);
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-solar-emerald/30 border-t-solar-emerald rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-mono">Loading SunPower Executive Dashboard...</span>
        </div>
      </div>
    );
  }

  const { kpis, sales_funnel, revenue_trends, capacity_distribution, type_distribution } = data;

  const kpiIcons: Record<string, any> = {
    total_enquiries: FileText,
    new_enquiries_today: Clock,
    active_quotations: FileCheck,
    confirmed_orders: CheckCircle,
    installations_in_progress: Wrench,
    completed_installations: Award,
    pending_site_surveys: Clock,
    total_revenue: CircleDollarSign,
    outstanding_payments: CreditCard,
    inventory_valuation: Warehouse,
    open_service_tickets: Headphones,
    total_warranty_claims: ShieldCheck,
  };

  const COLORS = ["#10B981", "#F59E0B", "#3B82F6", "#8B5CF6"];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Executive Command Banner */}
      <div className="glass-panel p-5 rounded-2xl border border-solar-border/80 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-solar-card via-slate-900 to-solar-dark relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-solar-emerald/10 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-1 z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider">
              Executive Director Dashboard
            </span>
            <span className="text-xs text-slate-400 font-medium">PM Surya Ghar Certified EPC</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            SunPower Solutions — Solar Installation ERP
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl">
            Real-time operations control center: tracking 40 monthly rooftop installations, 15 field technicians, serial QR scanning, and job-wise profit visibility.
          </p>
        </div>

        {/* Timeframe Filters */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800 z-10 self-start md:self-auto">
          {["today", "week", "month", "year"].map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                timeframe === t
                  ? "bg-solar-emerald text-slate-950 shadow-solar-emerald"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* 12 Executive KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3.5">
        {Object.entries(kpis).map(([key, kpi]: [string, any]) => {
          const Icon = kpiIcons[key] || Zap;
          const isUp = kpi.trend === "up";
          const isRevenue = key.includes("revenue") || key.includes("valuation") || key.includes("payments");

          return (
            <div
              key={key}
              className="glass-panel glass-panel-hover p-3.5 rounded-2xl border border-solar-border/80 flex flex-col justify-between transition-all group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-medium text-slate-400 truncate max-w-[110px]" title={kpi.title}>
                    {kpi.title}
                  </span>
                  <div className="p-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-solar-emerald group-hover:scale-110 transition-transform">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                  {kpi.formatted || (typeof kpi.value === "number" ? kpi.value.toLocaleString() : kpi.value)}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 mt-2 text-[10px]">
                <div className="flex items-center gap-1">
                  {isUp ? (
                    <TrendingUp className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-rose-400" />
                  )}
                  <span className={isUp ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                    {kpi.change_pct > 0 ? `+${kpi.change_pct}%` : `${kpi.change_pct}%`}
                  </span>
                </div>
                <span className="text-slate-500 capitalize">{kpi.unit}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Top 3D Interactive Model & Sales Funnel Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 3D Interactive Rooftop Solar Simulator (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-solar-gold" />
              Live 3D Rooftop Solar Model & Sun Trajectory
            </h2>
            <button
              onClick={() => navigate("surveys")}
              className="text-xs text-solar-emerald hover:underline flex items-center gap-1"
            >
              Site Survey Specs <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <RooftopSolar3D initialTilt={15} initialCapacityKw={3.0} />
        </div>

        {/* Sales Conversion Funnel (5 cols) */}
        <div className="lg:col-span-5 glass-panel p-4 rounded-2xl border border-solar-border/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-white">Sales Conversion Funnel</h3>
                <p className="text-[11px] text-slate-400">Enquiries → Surveys → Quotations → Orders</p>
              </div>
              <button
                onClick={() => navigate("crm")}
                className="text-xs text-solar-emerald hover:underline font-semibold"
              >
                View Leads
              </button>
            </div>

            <div className="space-y-2.5">
              {sales_funnel.map((step: any, idx: number) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">{step.stage}</span>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="font-bold text-white">{step.count}</span>
                      <span className="text-[10px] text-solar-emerald font-semibold">({step.conversion_pct}%)</span>
                    </div>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-solar-emerald to-solar-gold transition-all duration-500"
                      style={{ width: `${Math.max(8, step.conversion_pct)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Overall Lead-to-Install Conversion</span>
            <span className="text-base font-extrabold text-solar-gold">68.4%</span>
          </div>
        </div>
      </div>

      {/* Revenue & Profit Trends + Capacity Distribution Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Monthly Revenue vs Costs vs Profit (8 cols) */}
        <div className="lg:col-span-8 glass-panel p-4 rounded-2xl border border-solar-border/80">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Monthly Revenue, Direct Costs & Net Profit (₹)</h3>
              <p className="text-[11px] text-slate-400">Calculated from actual completed project accounts & BOM costs</p>
            </div>
            <button
              onClick={() => navigate("finance")}
              className="text-xs text-solar-gold hover:underline font-semibold"
            >
              Job-wise P&L Table →
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenue_trends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#64748B" fontSize={11} />
                <YAxis
                  stroke="#64748B"
                  fontSize={11}
                  tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0F172A", borderColor: "#334155", borderRadius: "12px" }}
                  formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, ""]}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                <Area type="monotone" dataKey="revenue" name="Total Revenue" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="costs" name="Direct Costs" stroke="#EF4444" strokeWidth={2} fillOpacity={0} fill="#EF4444" />
                <Area type="monotone" dataKey="profit" name="Gross Profit" stroke="#F59E0B" strokeWidth={2.5} fillOpacity={1} fill="url(#colorProfit)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Capacity Share Pie Chart (4 cols) */}
        <div className="lg:col-span-4 glass-panel p-4 rounded-2xl border border-solar-border/80 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white mb-1">Rooftop Capacity Distribution</h3>
            <p className="text-[11px] text-slate-400 mb-3">Installations by kW rating</p>

            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={capacity_distribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {capacity_distribution.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0F172A", borderColor: "#334155", borderRadius: "12px" }}
                    formatter={(val: any, name: any) => [`${val} Units`, name]}
                  />
                  <Legend wrapperStyle={{ fontSize: "10px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
            <span className="text-xs text-emerald-300 font-semibold">
              3 kW PM Surya Ghar accounts for 55% of all orders
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
