"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  Package,
  FileSpreadsheet,
  ShoppingBag,
  Warehouse,
  QrCode,
  Truck,
  HardHat,
  Wrench,
  ShieldCheck,
  Headphones,
  Award,
  CircleDollarSign,
  BarChart3,
  Globe,
  ChevronLeft,
  ChevronRight,
  Sun,
  UserCheck
} from "lucide-react";

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export const navItems = [
  { id: "overview", label: "Executive Overview", icon: LayoutDashboard, category: "Core" },
  { id: "crm", label: "CRM & Enquiries", icon: Users, category: "Sales" },
  { id: "surveys", label: "Rooftop Site Surveys", icon: ClipboardCheck, category: "Sales" },
  { id: "packages", label: "Solar Packages & BOM", icon: Package, category: "Sales" },
  { id: "quotations", label: "Quotations", icon: FileSpreadsheet, category: "Sales" },
  { id: "orders", label: "Confirmed Orders", icon: ShoppingBag, category: "Operations" },
  { id: "inventory", label: "Warehouse Inventory", icon: Warehouse, category: "Operations" },
  { id: "serials", label: "Serial Numbers & QR", icon: QrCode, category: "Operations" },
  { id: "dispatch", label: "Dispatch Workflow", icon: Truck, category: "Operations" },
  { id: "technicians", label: "Technician Roster", icon: HardHat, category: "Field" },
  { id: "installations", label: "Installations & Tasks", icon: Wrench, category: "Field" },
  { id: "warranties", label: "Warranty Register", icon: ShieldCheck, category: "After-Sales" },
  { id: "service", label: "Service Complaints", icon: Headphones, category: "After-Sales" },
  { id: "subsidies", label: "PM Surya Ghar Subsidies", icon: Award, category: "Compliance" },
  { id: "finance", label: "Job Profitability (P&L)", icon: CircleDollarSign, category: "Finance" },
  { id: "analytics", label: "Advanced BI Analytics", icon: BarChart3, category: "Finance" },
  { id: "portal", label: "Customer Portal View", icon: UserCheck, category: "Portals" },
  { id: "public-enquiry", label: "Public Website Form", icon: Globe, category: "Portals" },
];

export default function Sidebar({ currentTab, onTabChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`relative h-screen flex flex-col border-r border-solar-border/80 bg-solar-dark/95 backdrop-blur-xl transition-all duration-300 z-30 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-solar-border/80">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-solar-emerald to-solar-gold flex items-center justify-center shadow-solar-emerald flex-shrink-0">
            <Sun className="w-6 h-6 text-slate-950 animate-spin-slow" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-extrabold tracking-wider text-white">
                SUNPOWER
              </span>
              <span className="text-[10px] font-semibold text-solar-emerald tracking-widest uppercase">
                SOLUTIONS ERP
              </span>
            </div>
          )}
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                isActive
                  ? "bg-gradient-to-r from-solar-emerald/20 to-solar-gold/10 text-white border border-solar-emerald/40 shadow-solar-emerald"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <Icon
                className={`w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110 ${
                  isActive ? "text-solar-emerald" : "text-slate-400 group-hover:text-solar-gold"
                }`}
              />
              {!collapsed && (
                <span className="truncate text-left flex-1">{item.label}</span>
              )}
              {!collapsed && isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-solar-emerald animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      {/* Footer System Status */}
      <div className="p-3 border-t border-solar-border/80">
        <div className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl bg-slate-900/60 border border-slate-800 ${collapsed ? "justify-center" : ""}`}>
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping flex-shrink-0" />
          {!collapsed && (
            <div className="flex flex-col text-[10px]">
              <span className="text-slate-300 font-semibold">ERP Database Active</span>
              <span className="text-emerald-400 font-mono">v2.0 • 40 Installs/Mo</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
