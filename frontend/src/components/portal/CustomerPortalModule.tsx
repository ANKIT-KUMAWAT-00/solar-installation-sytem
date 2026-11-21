"use client";

import React, { useState, useEffect } from "react";
import {
  Sun,
  ShieldCheck,
  Download,
  FileCheck,
  LifeBuoy,
  Zap,
  TrendingUp,
  Landmark,
  Building,
  Phone,
  Clock,
  Sparkles,
  ChevronRight,
  Plus
} from "lucide-react";
import { api } from "@/lib/api";
import dynamic from "next/dynamic";

const RooftopSolar3D = dynamic(() => import("../3d/RooftopSolar3D"), {
  ssr: false,
  loading: () => (
    <div className="h-72 flex items-center justify-center bg-slate-950/60 rounded-2xl text-slate-500 text-xs">
      Loading 3D Solar Model...
    </div>
  ),
});

export default function CustomerPortalModule() {
  const [installations, setInstallations] = useState<any[]>([]);
  const [warranties, setWarranties] = useState<any[]>([]);
  const [subsidies, setSubsidies] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick ticket filing modal
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [complaintText, setComplaintText] = useState("");
  const [submittingComplaint, setSubmittingComplaint] = useState(false);

  useEffect(() => {
    loadCustomerData();
  }, []);

  const loadCustomerData = async () => {
    setLoading(true);
    try {
      const [insts, wars, subs, tcks] = await Promise.all([
        api.getInstallations(),
        api.getWarranties(),
        api.getSubsidies(),
        api.getServiceTickets(),
      ]);
      setInstallations(insts || []);
      setWarranties(wars || []);
      setSubsidies(subs || []);
      setTickets(tcks || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const primaryInst = installations[0] || null;
  const primarySubsidy = subsidies[0] || null;

  const handleDownloadCertificate = async (id: number, code: string) => {
    try {
      const token = api.getToken();
      const res = await fetch(`http://localhost:8000/api/warranties/${id}/certificate`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed to download PDF");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `SunPower_Warranty_${code}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleFileComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!primaryInst) return;

    setSubmittingComplaint(true);
    try {
      await api.createServiceTicket({
        installation_id: primaryInst.id,
        fault_category: "INVERTER_FAULT",
        fault_code: "CUST-PORTAL-REPORT",
        priority: "MEDIUM",
        description: complaintText,
      });
      setShowComplaintModal(false);
      setComplaintText("");
      await loadCustomerData();
      alert("Your service ticket has been submitted to SunPower engineering team!");
    } catch (err: any) {
      alert("Failed to submit ticket: " + err.message);
    } finally {
      setSubmittingComplaint(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-emerald-950/40 p-6 rounded-2xl border border-amber-500/20 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <Sun className="w-5 h-5 animate-pulse" />
            </span>
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Customer Self-Service Portal
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Welcome to SunPower Solutions
          </h1>
          <p className="text-xs text-slate-400">
            Monitor your live rooftop solar installation, active warranties, and government subsidy status.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowComplaintModal(true)}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-lg shadow-rose-500/20 transition-all"
          >
            <LifeBuoy className="w-4 h-4" />
            Report Issue / Request Service
          </button>
        </div>
      </div>

      {/* Energy & Financial Savings Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400">Your Solar Capacity</span>
          <div className="text-xl font-bold text-amber-400 mt-1 font-mono">
            {primaryInst ? `${primaryInst.system_capacity_kw} kW` : "3.0 kW"}
          </div>
          <span className="text-[11px] text-slate-500">Bifacial Monocrystalline</span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-emerald-400">Est. Monthly Generation</span>
          <div className="text-xl font-bold text-emerald-400 mt-1 font-mono">380 kWh</div>
          <span className="text-[11px] text-emerald-400/80">~₹3,420 monthly bill savings</span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-cyan-400">PM Surya Ghar Subsidy</span>
          <div className="text-xl font-bold text-cyan-400 mt-1 font-mono">
            {primarySubsidy ? `₹${primarySubsidy.subsidy_amount_eligible_inr?.toLocaleString()}` : "₹78,000"}
          </div>
          <span className="text-[11px] text-cyan-400/80">
            Status: {primarySubsidy?.status?.replace(/_/g, " ") || "DISBURSED"}
          </span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-purple-400">Active Warranties</span>
          <div className="text-xl font-bold text-purple-400 mt-1 font-mono">{warranties.length} Items</div>
          <span className="text-[11px] text-purple-400/80">100% Comprehensive OEM</span>
        </div>
      </div>

      {/* Main Grid: 3D Rooftop Visualizer & Warranty Certificate Vault */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 3D Solar Model */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider block">
                  Digital Twin Visualization
                </span>
                <h3 className="text-base font-bold text-white">Your Rooftop Solar Array</h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                Live Simulation
              </span>
            </div>

            <div className="rounded-xl overflow-hidden border border-slate-800">
              <RooftopSolar3D />
            </div>
          </div>
        </div>

        {/* Warranties & Certificates Vault */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Equipment Warranties &amp; Certificates
              </h3>
              <span className="text-xs text-slate-400">{warranties.length} Registered</span>
            </div>

            {warranties.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-slate-800 text-slate-400 text-xs">
                No active warranties found under your customer account.
              </div>
            ) : (
              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                {warranties.map((w) => (
                  <div
                    key={w.id}
                    className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-emerald-400">{w.warranty_code}</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold">
                        {w.duration_years} Yr Warranty
                      </span>
                    </div>

                    <p className="text-slate-200 font-medium">{w.product_name}</p>
                    <p className="text-[11px] text-slate-400 font-mono">Serial: {w.serial_number}</p>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-[10px] text-slate-500">
                        Expires: {new Date(w.end_date).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => handleDownloadCertificate(w.id, w.warranty_code)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg text-[11px] font-medium flex items-center gap-1 transition-colors"
                      >
                        <Download className="w-3 h-3" />
                        PDF Certificate
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Complaint Modal */}
      {showComplaintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <LifeBuoy className="w-5 h-5 text-rose-400" />
                Submit Customer Service Ticket
              </h3>
              <button
                onClick={() => setShowComplaintModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFileComplaint} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  Describe what you are observing:
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="e.g. Inverter display is blank, or daily generation on solar app dropped suddenly..."
                  value={complaintText}
                  onChange={(e) => setComplaintText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-lg text-[11px] text-emerald-300">
                All repairs under active warranty are carried out free of charge with original manufacturer spares.
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowComplaintModal(false)}
                  className="w-1/2 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingComplaint}
                  className="w-1/2 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-semibold rounded-xl"
                >
                  {submittingComplaint ? "Submitting..." : "Submit Ticket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
