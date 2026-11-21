"use client";

import React, { useState, useEffect } from "react";
import {
  LifeBuoy,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Wrench,
  ShieldAlert,
  ShieldCheck,
  Search,
  Filter,
  Plus,
  User,
  Phone,
  Building,
  Zap,
  Activity,
  Cpu
} from "lucide-react";
import { api } from "@/lib/api";
import dynamic from "next/dynamic";

const InverterDevice3D = dynamic(() => import("../3d/InverterDevice3D"), {
  ssr: false,
  loading: () => (
    <div className="h-64 flex items-center justify-center bg-slate-950/60 rounded-xl text-slate-500 text-xs">
      Loading 3D Inverter Diagnostics...
    </div>
  ),
});

export default function ServiceDeskModule() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [installations, setInstallations] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);

  // New Ticket Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedInstId, setSelectedInstId] = useState<number | "">("");
  const [faultCategory, setFaultCategory] = useState("INVERTER_FAULT");
  const [faultCode, setFaultCode] = useState("ERR-F023-OVERVOLTAGE");
  const [priority, setPriority] = useState("HIGH");
  const [description, setDescription] = useState(
    "Inverter showing red blinking LED. Grid voltage fluctuation detected in morning hours. Customer reported zero generation."
  );
  const [submittingTicket, setSubmittingTicket] = useState(false);

  // Resolve Ticket Modal / Action State
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [assignTechId, setAssignTechId] = useState<number | "">("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchTickets();
    fetchMetadata();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const data = await api.getServiceTickets();
      setTickets(data || []);
      if (data && data.length > 0) {
        setSelectedTicket(data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const [insts, techs] = await Promise.all([
        api.getInstallations(),
        api.getTechnicians(),
      ]);
      setInstallations(insts || []);
      setTechnicians(techs || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstId) {
      alert("Please select an installation project");
      return;
    }

    setSubmittingTicket(true);
    try {
      await api.createServiceTicket({
        installation_id: Number(selectedInstId),
        fault_category: faultCategory,
        fault_code: faultCode,
        priority: priority,
        description: description,
      });

      setShowCreateModal(false);
      await fetchTickets();
    } catch (err: any) {
      alert("Failed to submit service ticket: " + err.message);
    } finally {
      setSubmittingTicket(false);
    }
  };

  const handleUpdateTicketStatus = async (newStatus: string) => {
    if (!selectedTicket) return;
    setUpdating(true);
    try {
      const payload: any = { status: newStatus };
      if (resolutionNotes) payload.resolution_notes = resolutionNotes;
      if (assignTechId) payload.assigned_technician_id = Number(assignTechId);

      await api.updateServiceTicket(selectedTicket.id, payload);
      await fetchTickets();
      setSelectedTicket((prev: any) => ({ ...prev, status: newStatus }));
      setResolutionNotes("");
    } catch (err: any) {
      alert("Update failed: " + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const filtered = tickets.filter((t) => {
    const matchesSearch =
      t.ticket_number.toLowerCase().includes(search.toLowerCase()) ||
      t.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      t.fault_category.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <LifeBuoy className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                After-Sales Service Desk &amp; RMA Warranty Claims
              </h1>
              <p className="text-sm text-slate-400">
                Automated warranty eligibility checking: ₹0 replacement if covered, transparent billing if expired.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-medium rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-rose-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Log Service Complaint
          </button>
        </div>
      </div>

      {/* Main Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Tickets Queue */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Service Queue ({filtered.length})
            </h2>
            <div className="flex gap-1">
              {["ALL", "NEW", "ASSIGNED", "RESOLVED"].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`text-[10px] px-2 py-0.5 rounded font-medium transition-colors ${
                    statusFilter === st
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                      : "bg-slate-800 text-slate-400 hover:text-slate-300"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by ticket, customer, or fault..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400 bg-slate-900/40 rounded-xl border border-slate-800">
              Loading tickets...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/40 rounded-xl border border-slate-800 text-slate-400">
              No tickets match your filter.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[720px] overflow-y-auto pr-1">
              {filtered.map((t) => {
                const isSelected = selectedTicket?.id === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-slate-800/90 border-rose-500/50 ring-1 ring-rose-500/30 shadow-lg shadow-rose-500/5"
                        : "bg-slate-900/50 border-slate-800/80 hover:bg-slate-800/40 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white text-xs">{t.ticket_number}</span>
                          <span
                            className={`text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase ${
                              t.priority === "CRITICAL"
                                ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                : t.priority === "HIGH"
                                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                : "bg-slate-800 text-slate-400"
                            }`}
                          >
                            {t.priority}
                          </span>
                        </div>
                        <p className="text-xs text-slate-200 font-medium mt-1">{t.customer_name}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{t.fault_category.replace(/_/g, " ")}</p>
                      </div>

                      <div className="text-right">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                            t.status === "RESOLVED" || t.status === "CLOSED"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          }`}
                        >
                          {t.status}
                        </span>
                        <div className="text-[10px] font-mono mt-1 text-slate-400">
                          {t.is_covered_under_warranty ? (
                            <span className="text-emerald-400 font-semibold">₹0 Under War.</span>
                          ) : (
                            <span className="text-amber-400">₹{t.customer_charge_inr} Charge</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Ticket Workbench & 3D Inverter Telemetry */}
        <div className="lg:col-span-7 space-y-6">
          {selectedTicket ? (
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-6">
              {/* Ticket Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">
                      Complaint Details
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                      {selectedTicket.fault_code}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-1">
                    {selectedTicket.ticket_number} — {selectedTicket.customer_name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Phone: {selectedTicket.customer_phone} • Reported on{" "}
                    {new Date(selectedTicket.reported_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Assigned Crew</span>
                  <span className="text-xs font-semibold text-white">
                    {selectedTicket.assigned_technician_name}
                  </span>
                </div>
              </div>

              {/* Warranty Coverage Card */}
              <div
                className={`p-4 rounded-xl border flex items-center justify-between ${
                  selectedTicket.is_covered_under_warranty
                    ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-300"
                    : "bg-amber-950/30 border-amber-500/30 text-amber-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  {selectedTicket.is_covered_under_warranty ? (
                    <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
                  ) : (
                    <ShieldAlert className="w-6 h-6 text-amber-400 shrink-0" />
                  )}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider">
                      {selectedTicket.is_covered_under_warranty
                        ? "Valid Warranty Coverage Active"
                        : "Out-of-Warranty or Expired Policy"}
                    </h4>
                    <p className="text-[11px] opacity-80 mt-0.5">
                      {selectedTicket.is_covered_under_warranty
                        ? "Repair and replacement components covered under SunPower OEM manufacturer warranty."
                        : "Standard service charges + replacement component billing applicable to customer."}
                    </p>
                  </div>
                </div>

                <div className="text-right pl-3 shrink-0">
                  <span className="text-[10px] uppercase tracking-wider block opacity-75">Customer Fee</span>
                  <span className="text-base font-bold font-mono">
                    ₹{selectedTicket.customer_charge_inr?.toLocaleString() || 0}
                  </span>
                </div>
              </div>

              {/* Complaint Description */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Customer Issue Description
                </span>
                <p className="text-xs text-slate-200 leading-relaxed">{selectedTicket.description}</p>
              </div>

              {/* 3D Inverter Telemetry Diagnostic HUD */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-rose-400" />
                    Interactive Inverter Hardware &amp; Telemetry Diagnostics
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Status: ALERT_F023</span>
                </div>
                <div className="rounded-xl overflow-hidden border border-slate-800">
                  <InverterDevice3D initialStatus="WARNING" />
                </div>
              </div>

              {/* Resolution Action Area */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
                  Technician Resolution &amp; Status Actions
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Assign Certified Technician</label>
                    <select
                      value={assignTechId}
                      onChange={(e) => setAssignTechId(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    >
                      <option value="">Select Technician...</option>
                      {technicians.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.assigned_region})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Resolution Summary</label>
                    <input
                      type="text"
                      placeholder="e.g. Replaced DC SPD Cartridge, reset inverter firmware..."
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    onClick={() => handleUpdateTicketStatus("IN_PROGRESS")}
                    disabled={updating}
                    className="px-3 py-1.5 bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-medium transition-colors"
                  >
                    Mark In-Progress
                  </button>
                  <button
                    onClick={() => handleUpdateTicketStatus("RESOLVED")}
                    disabled={updating}
                    className="px-3 py-1.5 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-medium transition-colors"
                  >
                    Mark Resolved
                  </button>
                  <button
                    onClick={() => handleUpdateTicketStatus("CLOSED")}
                    disabled={updating}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-medium transition-colors"
                  >
                    Close Ticket
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800 text-slate-400">
              Select a complaint ticket on the left to inspect diagnostics.
            </div>
          )}
        </div>
      </div>

      {/* New Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <LifeBuoy className="w-5 h-5 text-rose-400" />
                Log Customer Service Complaint
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  Customer Rooftop Installation
                </label>
                <select
                  value={selectedInstId}
                  onChange={(e) => setSelectedInstId(Number(e.target.value))}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                >
                  <option value="">Select Installation...</option>
                  {installations.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.installation_code} — {inst.customer_name} ({inst.system_capacity_kw} kW)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Fault Category</label>
                  <select
                    value={faultCategory}
                    onChange={(e) => setFaultCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                  >
                    <option value="INVERTER_FAULT">Inverter Error</option>
                    <option value="PANEL_DAMAGE">Panel Degradation</option>
                    <option value="WIRING_ISSUE">Wiring / Conduit Cut</option>
                    <option value="NET_METER_OFFLINE">Net Meter Synchronization</option>
                    <option value="STRUCTURE_LOOSE">Structure / Rail Bolt</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Fault Code</label>
                <input
                  type="text"
                  value={faultCode}
                  onChange={(e) => setFaultCode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                />
              </div>

              <div className="p-3 bg-rose-950/20 border border-rose-500/20 rounded-lg text-[11px] text-rose-300">
                System will automatically query the equipment warranty table upon submission to verify free replacement eligibility.
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="w-1/2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingTicket}
                  className="w-1/2 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
                >
                  {submittingTicket ? "Submitting..." : "Log Ticket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
