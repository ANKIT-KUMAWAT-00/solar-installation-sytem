"use client";

import React, { useState } from "react";
import {
  Bell,
  Search,
  User,
  Shield,
  Radio,
  ChevronDown,
  Check,
  PlusCircle,
  QrCode,
  DollarSign,
  SunMedium
} from "lucide-react";
import { api } from "@/lib/api";

interface NavbarProps {
  currentRole: string;
  onRoleChange: (role: string) => void;
  onQuickAction: (action: string) => void;
}

const rolesList = [
  { id: "DIRECTOR", name: "Rajesh Sharma", title: "Company Director", badge: "Executive" },
  { id: "ADMIN", name: "System Admin", title: "Full System Admin", badge: "Admin" },
  { id: "SALES_EXECUTIVE", name: "Amit Verma", title: "Sales & Proposals", badge: "Sales" },
  { id: "SURVEY_TECHNICIAN", name: "Vikas Patil", title: "Rooftop Site Surveyor", badge: "Field" },
  { id: "WAREHOUSE_MANAGER", name: "Sanjay Kulkarni", title: "Warehouse & Serial QR", badge: "Warehouse" },
  { id: "INSTALLATION_MANAGER", name: "Mahesh Deshmukh", title: "Installation Scheduler", badge: "Operations" },
  { id: "FIELD_TECHNICIAN", name: "Ramesh Yadav", title: "Lead PV Electrician", badge: "Field" },
  { id: "FINANCE_EXECUTIVE", name: "Pooja Mehta", title: "Billing & Profitability", badge: "Finance" },
  { id: "SUPPORT_EXECUTIVE", name: "Kavita Nair", title: "Warranty & Complaints", badge: "Support" },
  { id: "CUSTOMER", name: "Dr. Anil Joshi", title: "Rooftop Solar Client", badge: "Client" },
];

export default function Navbar({ currentRole, onRoleChange, onQuickAction }: NavbarProps) {
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const activeUser = rolesList.find((r) => r.id === currentRole) || rolesList[0];

  const handleSelectRole = async (roleId: string) => {
    try {
      await api.switchRole(roleId);
      onRoleChange(roleId);
      setRoleMenuOpen(false);
    } catch (e) {
      console.error(e);
      onRoleChange(roleId);
      setRoleMenuOpen(false);
    }
  };

  return (
    <header className="h-16 border-b border-solar-border/80 bg-solar-dark/80 backdrop-blur-xl px-4 flex items-center justify-between sticky top-0 z-20">
      {/* Left: Search Bar & Fast Ticker */}
      <div className="flex items-center gap-4 flex-1 max-w-lg">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search enquiries, orders, serial numbers, customers..."
            className="w-full bg-slate-900/70 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-solar-emerald transition-all"
          />
        </div>
      </div>

      {/* Right: Quick Actions, Role Switcher & Notifications */}
      <div className="flex items-center gap-3">
        {/* Quick Action Buttons */}
        <div className="hidden lg:flex items-center gap-2">
          <button
            onClick={() => onQuickAction("new-enquiry")}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 flex items-center gap-1.5 transition-all shadow-sm"
          >
            <PlusCircle className="w-3.5 h-3.5" /> + Lead
          </button>
          <button
            onClick={() => onQuickAction("scan-qr")}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-400 hover:bg-amber-500/25 flex items-center gap-1.5 transition-all shadow-sm"
          >
            <QrCode className="w-3.5 h-3.5" /> Scan QR
          </button>
          <button
            onClick={() => onQuickAction("record-payment")}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-500/15 border border-blue-500/30 text-blue-400 hover:bg-blue-500/25 flex items-center gap-1.5 transition-all shadow-sm"
          >
            <DollarSign className="w-3.5 h-3.5" /> + Payment
          </button>
        </div>

        {/* Live Notification Indicator */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 transition-all"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-solar-gold text-slate-950 font-extrabold text-[9px] flex items-center justify-center animate-pulse">
              3
            </span>
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl glass-panel border border-solar-border shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-bold text-white">
                <span>Recent System Events</span>
                <span className="text-[10px] text-solar-emerald font-normal">Live WebSocket</span>
              </div>
              <div className="mt-2 space-y-2 text-xs">
                <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 flex gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-slate-200">New Web Enquiry</div>
                    <div className="text-[11px] text-slate-400">Dr. Anil Joshi requested 3 kW On-Grid system.</div>
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 flex gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-400 mt-1 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-slate-200">Advance Payment Received</div>
                    <div className="text-[11px] text-slate-400">₹65,184 verified via UPI for ORD-2026-0001.</div>
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 flex gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400 mt-1 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-slate-200">PM Surya Ghar Approved</div>
                    <div className="text-[11px] text-slate-400">₹78,000 subsidy sanctioned by MSEDCL.</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Role Persona Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-solar-emerald/40 hover:border-solar-emerald transition-all shadow-solar-emerald"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-solar-emerald to-emerald-600 flex items-center justify-center text-slate-950 font-bold text-xs flex-shrink-0">
              {activeUser.name.charAt(0)}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                {activeUser.name}
                <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-solar-gold/20 text-solar-gold border border-solar-gold/30">
                  {activeUser.badge}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 truncate max-w-[110px]">
                {activeUser.title}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
          </button>

          {roleMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl glass-panel border border-solar-border shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-3 py-2 border-b border-slate-800 mb-1">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-solar-emerald" /> Quick Persona Switcher
                </div>
                <div className="text-[10px] text-slate-400">
                  Instant RBAC testing for all 10 ERP roles
                </div>
              </div>

              <div className="max-h-72 overflow-y-auto space-y-1">
                {rolesList.map((r) => {
                  const isSelected = r.id === currentRole;
                  return (
                    <button
                      key={r.id}
                      onClick={() => handleSelectRole(r.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all ${
                        isSelected
                          ? "bg-solar-emerald/20 text-white border border-solar-emerald/40"
                          : "hover:bg-slate-800/60 text-slate-300"
                      }`}
                    >
                      <div>
                        <div className="text-xs font-semibold flex items-center gap-2">
                          {r.name}
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {r.badge}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400">{r.title}</div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-solar-emerald" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
