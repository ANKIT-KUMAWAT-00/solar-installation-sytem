"use client";

import React, { useEffect, useState } from "react";
import {
  Users,
  Plus,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  FileText
} from "lucide-react";
import { api } from "@/lib/api";

interface CRMModuleProps {
  onScheduleSurvey?: (leadId: number) => void;
}

export default function CRMModule({ onScheduleSurvey }: CRMModuleProps) {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [search, setSearch] = useState("");
  const [newLeadModalOpen, setNewLeadModalOpen] = useState(false);

  // New Lead Form State
  const [formData, setFormData] = useState({
    customer_name: "",
    phone: "",
    email: "",
    address: "",
    city: "Pune",
    state: "Maharashtra",
    postal_code: "411001",
    requested_capacity_kw: 3.0,
    preferred_system_type: "ON_GRID",
    subsidy_required: true,
    lead_source: "WEBSITE",
    priority: "HIGH",
    contact_notes: "",
  });

  useEffect(() => {
    loadLeads();
  }, [filterStatus]);

  const loadLeads = async () => {
    try {
      setLoading(true);
      const params = filterStatus ? `status=${filterStatus}` : "";
      const res = await api.getLeads(params);
      setLeads(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createLead(formData);
      setNewLeadModalOpen(false);
      loadLeads();
    } catch (e: any) {
      alert(`Error creating lead: ${e.message}`);
    }
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      await api.updateLead(id, { status: newStatus });
      loadLeads();
    } catch (e: any) {
      alert(`Error updating lead: ${e.message}`);
    }
  };

  const pipelineStages = [
    { id: "NEW", label: "New Enquiry", color: "border-blue-500/40 text-blue-400 bg-blue-500/10" },
    { id: "CONTACTED", label: "Contacted", color: "border-amber-500/40 text-amber-400 bg-amber-500/10" },
    { id: "QUALIFIED", label: "Qualified", color: "border-purple-500/40 text-purple-400 bg-purple-500/10" },
    { id: "SURVEY_SCHEDULED", label: "Survey Scheduled", color: "border-cyan-500/40 text-cyan-400 bg-cyan-500/10" },
    { id: "SURVEY_COMPLETED", label: "Survey Done", color: "border-emerald-500/40 text-emerald-400 bg-emerald-500/10" },
    { id: "QUOTATION_PREPARED", label: "Quotation Sent", color: "border-yellow-500/40 text-yellow-400 bg-yellow-500/10" },
    { id: "CONVERTED", label: "Converted to Order", color: "border-emerald-500 text-emerald-300 bg-emerald-500/20" },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2.5">
            <Users className="w-5 h-5 text-solar-emerald" /> Customer Enquiry & CRM Lead Pipeline
          </h1>
          <p className="text-xs text-slate-400">
            End-to-end enquiry lifecycle: Website, WhatsApp, Phone calls, and Referrals.
          </p>
        </div>

        <button
          onClick={() => setNewLeadModalOpen(true)}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-solar-emerald hover:bg-emerald-400 text-slate-950 flex items-center gap-2 shadow-solar-emerald transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Customer Lead
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-solar-border/80">
        <button
          onClick={() => setFilterStatus("")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
            filterStatus === ""
              ? "bg-solar-emerald text-slate-950 font-bold"
              : "text-slate-400 hover:text-white"
          }`}
        >
          All Leads ({leads.length})
        </button>
        {pipelineStages.map((st) => (
          <button
            key={st.id}
            onClick={() => setFilterStatus(st.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              filterStatus === st.id
                ? "bg-slate-800 text-solar-emerald border border-solar-emerald/40"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {st.label}
          </button>
        ))}
      </div>

      {/* Kanban / Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {leads.map((lead) => (
          <div
            key={lead.id}
            className="glass-panel glass-panel-hover p-4 rounded-2xl border border-solar-border/80 flex flex-col justify-between transition-all"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <span className="text-[10px] font-mono text-solar-emerald">{lead.enquiry_number}</span>
                  <h3 className="text-sm font-bold text-white">{lead.customer_name}</h3>
                </div>
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${
                    lead.status === "CONVERTED"
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                      : "bg-slate-800 text-solar-gold border-slate-700"
                  }`}
                >
                  {lead.status.replace("_", " ")}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-300 mt-3">
                <div className="flex items-center gap-2 text-slate-400">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  <span>{lead.customer_phone}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span>{lead.customer_city || "Maharashtra"}</span>
                </div>
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-800/80">
                  <span className="text-solar-gold font-bold">{lead.requested_capacity_kw} kW</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-300">{lead.preferred_system_type.replace("_", " ")}</span>
                  {lead.subsidy_required && (
                    <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      PM Surya Ghar
                    </span>
                  )}
                </div>
              </div>

              {lead.contact_notes && (
                <div className="mt-3 p-2 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 italic">
                  "{lead.contact_notes}"
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
              <select
                value={lead.status}
                onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-solar-emerald"
              >
                {pipelineStages.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
                <option value="LOST">Mark as Lost</option>
              </select>

              {lead.status !== "CONVERTED" && (
                <button
                  onClick={() => onScheduleSurvey?.(lead.id)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 transition-all"
                >
                  Schedule Survey
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* New Lead Modal */}
      {newLeadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="glass-panel w-full max-w-lg rounded-2xl border border-solar-border shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-solar-emerald" /> New Customer Lead & Enquiry
              </h2>
              <button onClick={() => setNewLeadModalOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium">Customer Full Name *</label>
                  <input
                    required
                    type="text"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white mt-1"
                    placeholder="e.g. Ramesh Kulkarni"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-medium">Phone Number *</label>
                  <input
                    required
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white mt-1"
                    placeholder="+91 98200 12345"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white mt-1"
                    placeholder="client@gmail.com"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-medium">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-medium">Installation Address</label>
                <input
                  required
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white mt-1"
                  placeholder="Plot 14, Sunrise Enclave"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium">Required Capacity (kW)</label>
                  <select
                    value={formData.requested_capacity_kw}
                    onChange={(e) => setFormData({ ...formData, requested_capacity_kw: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white mt-1"
                  >
                    <option value={1.0}>1 kW System</option>
                    <option value={2.0}>2 kW System</option>
                    <option value={3.0}>3 kW System (PM Surya Ghar)</option>
                    <option value={4.0}>4 kW System</option>
                    <option value={5.0}>5 kW System</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 font-medium">System Type</label>
                  <select
                    value={formData.preferred_system_type}
                    onChange={(e) => setFormData({ ...formData, preferred_system_type: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white mt-1"
                  >
                    <option value="ON_GRID">On-Grid (Net Metering)</option>
                    <option value="OFF_GRID">Off-Grid (Battery Bank)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-medium">Notes / Special Instructions</label>
                <textarea
                  rows={2}
                  value={formData.contact_notes}
                  onChange={(e) => setFormData({ ...formData, contact_notes: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white mt-1"
                  placeholder="e.g. Inquired about ₹78,000 subsidy eligibility"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setNewLeadModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl font-bold bg-solar-emerald hover:bg-emerald-400 text-slate-950 shadow-solar-emerald"
                >
                  Save Lead Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
