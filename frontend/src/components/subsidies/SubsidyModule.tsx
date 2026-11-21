"use client";

import React, { useState, useEffect } from "react";
import {
  Landmark,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Search,
  Filter,
  ArrowRight,
  TrendingUp,
  FileCheck,
  Building,
  User,
  ShieldCheck,
  Zap
} from "lucide-react";
import { api } from "@/lib/api";

export default function SubsidyModule() {
  const [subsidies, setSubsidies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchSubsidies();
  }, []);

  const fetchSubsidies = async () => {
    setLoading(true);
    try {
      const data = await api.getSubsidies();
      setSubsidies(data || []);
      if (data && data.length > 0) {
        setSelectedApp(data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedApp) return;
    setUpdating(true);
    try {
      await api.updateSubsidy(selectedApp.id, { status: newStatus });
      await fetchSubsidies();
      setSelectedApp((prev: any) => ({ ...prev, status: newStatus }));
    } catch (err: any) {
      alert("Failed to update subsidy status: " + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const filtered = subsidies.filter((s) => {
    const matchesSearch =
      s.application_number.toLowerCase().includes(search.toLowerCase()) ||
      s.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      s.consumer_number.toLowerCase().includes(search.toLowerCase()) ||
      s.order_number.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalDisbursed = subsidies
    .filter((s) => s.status === "DISBURSED")
    .reduce((acc, s) => acc + (s.subsidy_amount_eligible_inr || 0), 0);

  const pendingApproval = subsidies.filter(
    (s) => s.status !== "DISBURSED" && s.status !== "REJECTED"
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                PM Surya Ghar: Muft Bijli Yojana &amp; DISCOM Subsidy Tracker
              </h1>
              <p className="text-sm text-slate-400">
                Direct government benefit transfer management, DISCOM portal liaison, net meter inspection, and direct bank disbursement.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchSubsidies()}
            className="px-4 py-2 text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl border border-slate-700 transition-colors"
          >
            Refresh Applications
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400">Total Applications</span>
          <div className="text-2xl font-bold text-white mt-1">{subsidies.length}</div>
          <span className="text-[11px] text-slate-500">National Portal Linked</span>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-amber-400">Under Process</span>
          <div className="text-2xl font-bold text-amber-400 mt-1">{pendingApproval}</div>
          <span className="text-[11px] text-amber-400/80">Pending DISCOM / Inspection</span>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-emerald-400">Subsidy Disbursed</span>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            ₹{totalDisbursed.toLocaleString()}
          </div>
          <span className="text-[11px] text-emerald-400/80">Direct DBT to Customer</span>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-cyan-400">DISCOM Grid Utility</span>
          <div className="text-2xl font-bold text-cyan-400 mt-1">MSEDCL</div>
          <span className="text-[11px] text-cyan-400/80">Maharashtra Distribution</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Applications Queue */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Applications ({filtered.length})
            </h2>
            <div className="flex gap-1">
              {["ALL", "PORTAL_SUBMITTED", "DISBURSED"].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`text-[10px] px-2 py-0.5 rounded font-medium transition-colors ${
                    statusFilter === st
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                      : "bg-slate-800 text-slate-400 hover:text-slate-300"
                  }`}
                >
                  {st.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by app no, consumer no, or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400 bg-slate-900/40 rounded-xl border border-slate-800">
              Loading applications...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/40 rounded-xl border border-slate-800 text-slate-400">
              No applications match criteria.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[700px] overflow-y-auto pr-1">
              {filtered.map((app) => {
                const isSelected = selectedApp?.id === app.id;
                return (
                  <div
                    key={app.id}
                    onClick={() => setSelectedApp(app)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-slate-800/90 border-cyan-500/50 ring-1 ring-cyan-500/30 shadow-lg shadow-cyan-500/5"
                        : "bg-slate-900/50 border-slate-800/80 hover:bg-slate-800/40 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white text-xs">
                            {app.application_number}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                            {app.capacity_kw} kW
                          </span>
                        </div>
                        <p className="text-xs text-slate-200 font-medium mt-1">{app.customer_name}</p>
                        <p className="text-[11px] text-slate-400 font-mono">Consumer: {app.consumer_number}</p>
                      </div>

                      <div className="text-right">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                            app.status === "DISBURSED"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : app.status === "REJECTED"
                              ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                              : "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                          }`}
                        >
                          {app.status?.replace(/_/g, " ")}
                        </span>
                        <span className="text-xs font-mono font-bold text-emerald-400 block mt-1">
                          ₹{app.subsidy_amount_eligible_inr?.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Application Details & Workflow */}
        <div className="lg:col-span-7">
          {selectedApp ? (
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div>
                  <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                    {selectedApp.scheme_name || "PM Surya Ghar: Muft Bijli Yojana"}
                  </span>
                  <h3 className="text-lg font-bold text-white mt-0.5">
                    {selectedApp.application_number} — {selectedApp.customer_name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Order: {selectedApp.order_number} • DISCOM: {selectedApp.discom_name}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400 block">DBT Subsidy Amount</span>
                  <span className="text-xl font-bold font-mono text-emerald-400">
                    ₹{selectedApp.subsidy_amount_eligible_inr?.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Progress Milestones */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 block">
                  Government Pipeline Milestones
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-center text-xs">
                  <div
                    className={`p-2 rounded-lg border ${
                      selectedApp.status !== "DOCUMENT_COLLECTION"
                        ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-300"
                        : "bg-slate-900 border-slate-800 text-slate-400"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mx-auto mb-1 text-emerald-400" />
                    <span>Portal Submitted</span>
                  </div>
                  <div
                    className={`p-2 rounded-lg border ${
                      ["DISCOM_APPROVAL", "JOINT_INSPECTION_PENDING", "NET_METER_INSTALLED", "DISBURSED"].includes(
                        selectedApp.status
                      )
                        ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-300"
                        : "bg-slate-900 border-slate-800 text-slate-400"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mx-auto mb-1 text-emerald-400" />
                    <span>DISCOM Approval</span>
                  </div>
                  <div
                    className={`p-2 rounded-lg border ${
                      ["NET_METER_INSTALLED", "DISBURSED"].includes(selectedApp.status)
                        ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-300"
                        : "bg-slate-900 border-slate-800 text-slate-400"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mx-auto mb-1 text-emerald-400" />
                    <span>Net Meter Linked</span>
                  </div>
                  <div
                    className={`p-2 rounded-lg border ${
                      selectedApp.status === "DISBURSED"
                        ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-300"
                        : "bg-slate-900 border-slate-800 text-slate-400"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mx-auto mb-1 text-emerald-400" />
                    <span>Subsidy Disbursed</span>
                  </div>
                </div>
              </div>

              {/* Document Verification Checklist */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
                  Required Compliance Documents
                </h4>
                <div className="space-y-2">
                  {[
                    { name: "Latest Electricity Bill (DISCOM)", status: "VERIFIED" },
                    { name: "Customer Aadhaar Card (Linked with Mobile)", status: "VERIFIED" },
                    { name: "Bank Passbook / Cancelled Cheque (DBT Account)", status: "VERIFIED" },
                    { name: "Rooftop Ownership Proof / Property Tax Receipt", status: "VERIFIED" },
                    { name: "DISCOM Net-Meter Synchronization Certificate", status: selectedApp.status === "DISBURSED" ? "VERIFIED" : "PENDING" },
                  ].map((doc, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 text-slate-300">
                        <FileText className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{doc.name}</span>
                      </div>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          doc.status === "VERIFIED"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}
                      >
                        {doc.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Update Actions */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <span className="text-xs font-semibold text-white uppercase tracking-wider block">
                  Update Government Process State
                </span>
                <div className="flex flex-wrap gap-2">
                  {[
                    "PORTAL_SUBMITTED",
                    "DISCOM_APPROVAL",
                    "JOINT_INSPECTION_PENDING",
                    "NET_METER_INSTALLED",
                    "DISBURSED",
                  ].map((st) => (
                    <button
                      key={st}
                      onClick={() => handleStatusChange(st)}
                      disabled={updating || selectedApp.status === st}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        selectedApp.status === st
                          ? "bg-cyan-600 text-white font-semibold"
                          : "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                      }`}
                    >
                      {st.replace(/_/g, " ")}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800 text-slate-400">
              Select an application on the left to inspect details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
