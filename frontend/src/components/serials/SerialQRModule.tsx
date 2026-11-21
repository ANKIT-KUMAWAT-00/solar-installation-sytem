"use client";

import React, { useEffect, useState } from "react";
import {
  QrCode,
  Search,
  Scan,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Copy,
  Printer
} from "lucide-react";
import { api } from "@/lib/api";

export default function SerialQRModule() {
  const [serials, setSerials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [search, setSearch] = useState("");
  const [selectedSerial, setSelectedSerial] = useState<any | null>(null);

  // Scanner Simulator State
  const [testSerialInput, setTestSerialInput] = useState("");
  const [scanResult, setScanResult] = useState<any | null>(null);

  useEffect(() => {
    loadSerials();
  }, [filterStatus]);

  const loadSerials = async () => {
    try {
      setLoading(true);
      const params = filterStatus ? `status=${filterStatus}` : "";
      const res = await api.getSerials(params);
      setSerials(res);
      if (res.length > 0 && !selectedSerial) {
        setSelectedSerial(res[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleTestScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testSerialInput.trim()) return;
    try {
      const res = await api.verifyScannedQR(testSerialInput.trim());
      setScanResult(res);
    } catch (e: any) {
      setScanResult({ valid: false, message: e.message });
    }
  };

  const handleQuickTestClick = (sNo: string) => {
    setTestSerialInput(sNo);
    api.verifyScannedQR(sNo).then(setScanResult);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-white flex items-center gap-2.5">
          <QrCode className="w-5 h-5 text-solar-emerald" /> Serial Number Register & Mobile QR Verification
        </h1>
        <p className="text-xs text-slate-400">
          Individual serialization of high-value solar modules, inverters, and battery banks with unique scannable QR labels.
        </p>
      </div>

      {/* QR Scanner Tool & Quick Validator */}
      <div className="glass-panel p-4 rounded-2xl border border-solar-border/80 bg-gradient-to-r from-slate-900 via-solar-card to-slate-900 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <Scan className="w-4 h-4 text-solar-gold animate-pulse" /> Mobile Barcode / QR Scanner Simulator
          </div>
          <span className="text-[11px] text-slate-400">Warehouse Dispatch Validation</span>
        </div>

        <form onSubmit={handleTestScan} className="flex gap-2">
          <input
            type="text"
            value={testSerialInput}
            onChange={(e) => setTestSerialInput(e.target.value)}
            placeholder="Scan QR or enter serial (e.g. INV-GROW-2026-1001 or PANEL-WAAR-2026-5001)..."
            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-solar-emerald"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-solar-emerald hover:bg-emerald-400 text-slate-950 shadow-solar-emerald flex items-center gap-1.5 transition-all"
          >
            <Scan className="w-3.5 h-3.5" /> Validate QR
          </button>
        </form>

        {scanResult && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 animate-in fade-in ${
              scanResult.valid
                ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
                : "bg-rose-500/10 border-rose-500/40 text-rose-300"
            }`}
          >
            {scanResult.valid ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-bold">{scanResult.message}</div>
              {scanResult.valid && (
                <div className="text-[11px] text-slate-300 mt-1">
                  Device: {scanResult.product_name} • Category: {scanResult.category} • Warranty: {scanResult.warranty_years} Years
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Split View: Serials List & QR Label Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Serials Table (8 cols) */}
        <div className="lg:col-span-8 glass-panel p-4 rounded-2xl border border-solar-border/80 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-white">Serialized Inventory Register ({serials.length})</span>
            <div className="flex gap-1.5">
              {["", "IN_WAREHOUSE", "DISPATCHED", "INSTALLED"].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                    filterStatus === st
                      ? "bg-solar-emerald text-slate-950"
                      : "bg-slate-900 border border-slate-800 text-slate-400"
                  }`}
                >
                  {st || "ALL"}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 border-b border-slate-800 sticky top-0 bg-solar-card">
                <tr>
                  <th className="py-2 px-3">Serial Number</th>
                  <th className="py-2 px-3">Equipment</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3 text-right">Warranty</th>
                  <th className="py-2 px-3 text-right">Quick Test</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {serials.map((s) => (
                  <tr
                    key={s.id}
                    onClick={() => setSelectedSerial(s)}
                    className={`hover:bg-slate-800/30 cursor-pointer transition-colors ${
                      selectedSerial?.id === s.id ? "bg-slate-800/50" : ""
                    }`}
                  >
                    <td className="py-2.5 px-3 font-mono font-bold text-solar-emerald">{s.serial_number}</td>
                    <td className="py-2.5 px-3">
                      <div className="text-white font-medium">{s.product_name}</div>
                      <div className="text-[10px] text-slate-400">{s.manufacturer} {s.model}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${
                          s.status === "INSTALLED"
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                            : s.status === "DISPATCHED"
                            ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                            : "bg-slate-800 text-solar-gold border-slate-700"
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                      {s.warranty_duration_years} Yrs
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickTestClick(s.serial_number);
                        }}
                        className="px-2 py-0.5 rounded text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                      >
                        Scan
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* QR Code Label Print Preview (4 cols) */}
        <div className="lg:col-span-4">
          {selectedSerial ? (
            <div className="glass-panel p-5 rounded-2xl border border-solar-border/80 space-y-4 text-center">
              <span className="text-[10px] font-bold text-solar-emerald uppercase tracking-wider">
                Official Hardware QR Label
              </span>

              {/* Render SVG QR Code */}
              <div className="bg-white p-4 rounded-2xl shadow-xl mx-auto w-56 h-56 flex items-center justify-center border-4 border-slate-800">
                {selectedSerial.qr_code_svg ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: selectedSerial.qr_code_svg }}
                    className="w-full h-full [&>svg]:w-full [&>svg]:h-full"
                  />
                ) : (
                  <QrCode className="w-32 h-32 text-slate-900" />
                )}
              </div>

              <div className="space-y-1">
                <div className="text-sm font-extrabold font-mono text-white tracking-wider">
                  {selectedSerial.serial_number}
                </div>
                <div className="text-xs font-semibold text-solar-gold">{selectedSerial.product_name}</div>
                <div className="text-[11px] text-slate-400">
                  {selectedSerial.manufacturer} • {selectedSerial.model}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 text-left space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Current Status:</span>
                  <span className="font-bold text-white">{selectedSerial.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Standard Warranty:</span>
                  <span className="font-bold text-solar-emerald">{selectedSerial.warranty_duration_years} Years</span>
                </div>
              </div>

              <button
                onClick={() => window.print()}
                className="w-full py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center gap-1.5 transition-all"
              >
                <Printer className="w-3.5 h-3.5" /> Print QR Adhesive Label
              </button>
            </div>
          ) : (
            <div className="glass-panel p-8 rounded-2xl border border-solar-border/80 text-center text-xs text-slate-400">
              Select an item to view printable QR code.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
