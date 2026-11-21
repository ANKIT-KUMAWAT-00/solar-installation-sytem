"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Search,
  Download,
  AlertCircle,
  CheckCircle2,
  Clock,
  Calendar,
  FileText,
  User,
  Phone,
  Barcode,
  Layers,
  Sparkles
} from "lucide-react";
import { api } from "@/lib/api";

export default function WarrantyModule() {
  const [warranties, setWarranties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Instant Lookup Tool
  const [lookupQuery, setLookupQuery] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState<any | null>(null);

  useEffect(() => {
    fetchWarranties();
  }, []);

  const fetchWarranties = async () => {
    setLoading(true);
    try {
      const data = await api.getWarranties();
      setWarranties(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupQuery.trim()) return;

    setLookupLoading(true);
    setLookupResult(null);
    try {
      const res = await api.lookupWarranty(lookupQuery.trim());
      setLookupResult(res);
    } catch (err: any) {
      setLookupResult({ found: false, message: err.message });
    } finally {
      setLookupLoading(false);
    }
  };

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
      alert("Error downloading certificate: " + err.message);
    }
  };

  const filtered = warranties.filter((w) => {
    const matchesSearch =
      w.warranty_code.toLowerCase().includes(search.toLowerCase()) ||
      w.serial_number.toLowerCase().includes(search.toLowerCase()) ||
      w.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      w.customer_phone.includes(search);
    const matchesStatus = statusFilter === "ALL" || w.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Automated Warranty Register &amp; Certificate Vault
              </h1>
              <p className="text-sm text-slate-400">
                Triggered on customer commissioning acceptance. Track equipment durations, expiry dates, and instant PDF certificates.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {["ALL", "ACTIVE", "EXPIRED", "CLAIM_PENDING"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                statusFilter === st
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:text-slate-300"
              }`}
            >
              {st.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Instant Warranty Verification Tool Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-emerald-950/20 border border-emerald-500/30 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Instant Warranty Verification Station
            </h3>
          </div>
          <span className="text-xs text-slate-400">Public &amp; Support Executive Lookup</span>
        </div>

        <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Enter Inverter/Panel Serial Number (e.g. INV-H-2026-001) or Customer Phone..."
              value={lookupQuery}
              onChange={(e) => setLookupQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={lookupLoading}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-colors shrink-0 flex items-center justify-center gap-2"
          >
            {lookupLoading ? "Verifying..." : "Verify Coverage"}
          </button>
        </form>

        {/* Lookup Results */}
        {lookupResult && (
          <div className="pt-3 border-t border-slate-800">
            {lookupResult.found ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  Found {lookupResult.count} registered warranty record(s):
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {lookupResult.results.map((res: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-950/80 border border-emerald-500/20 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-white">{res.serial_number}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                            res.is_valid_today
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                          }`}
                        >
                          {res.is_valid_today
                            ? `ACTIVE (${res.days_remaining} Days Left)`
                            : "EXPIRED"}
                        </span>
                      </div>
                      <p className="text-slate-300 font-medium">{res.product_name}</p>
                      <div className="grid grid-cols-2 gap-2 text-slate-400 text-[11px] pt-1">
                        <div>Customer: {res.customer_name}</div>
                        <div>Duration: {res.duration_years} Years</div>
                        <div>Start: {res.start_date}</div>
                        <div>Valid Until: {res.end_date}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{lookupResult.message}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Warranties Table */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden space-y-4 p-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by code, serial, or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <span className="text-xs text-slate-400">
            Showing {filtered.length} of {warranties.length} warranties
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading warranty records...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400">No warranty records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Warranty Code</th>
                  <th className="py-3 px-4">Serial / Component</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Valid Period</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Certificate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filtered.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium text-emerald-400">
                      {w.warranty_code}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-white block">{w.serial_number}</span>
                      <span className="text-[11px] text-slate-400">{w.product_name}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-white font-medium block">{w.customer_name}</span>
                      <span className="text-[11px] text-slate-400 font-mono">{w.customer_phone}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      <div>{w.start_date ? new Date(w.start_date).toLocaleDateString() : "-"}</div>
                      <div className="text-slate-400">
                        to {w.end_date ? new Date(w.end_date).toLocaleDateString() : "-"}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-white">
                      {w.duration_years} Years
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          w.status === "ACTIVE"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-slate-800 text-slate-400 border-slate-700"
                        }`}
                      >
                        {w.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDownloadCertificate(w.id, w.warranty_code)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 rounded-lg border border-slate-700 inline-flex items-center gap-1.5 transition-colors font-medium text-[11px]"
                      >
                        <Download className="w-3.5 h-3.5" />
                        PDF Certificate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
