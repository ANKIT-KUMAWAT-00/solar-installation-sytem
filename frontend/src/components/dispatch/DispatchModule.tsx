"use client";

import React, { useState, useEffect } from "react";
import {
  Truck,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  PackageCheck,
  Search,
  Barcode,
  Layers,
  ArrowRight,
  ShieldCheck,
  Building,
  UserCheck,
  Zap,
  Info
} from "lucide-react";
import { api } from "@/lib/api";
import confetti from "canvas-confetti";

export default function DispatchModule() {
  const [readyOrders, setReadyOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dispatch Form State
  const [driverName, setDriverName] = useState("Ramesh Kumar (Van #04)");
  const [vehicleNumber, setVehicleNumber] = useState("MH-12-SP-2026");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [scannedSerials, setScannedSerials] = useState<string[]>([]);
  const [dispatchSuccess, setDispatchSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Available serials in warehouse for quick simulation
  const [availableSerials, setAvailableSerials] = useState<any[]>([]);

  useEffect(() => {
    fetchReadyOrders();
    fetchWarehouseSerials();
  }, []);

  const fetchReadyOrders = async () => {
    setLoading(true);
    try {
      const data = await api.getOrdersReadyForDispatch();
      setReadyOrders(data || []);
      if (data && data.length > 0) {
        setSelectedOrder(data[0]);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load orders awaiting dispatch");
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehouseSerials = async () => {
    try {
      const serials = await api.getSerials("status=IN_STOCK");
      setAvailableSerials(serials || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddSerial = (sn: string) => {
    const trimmed = sn.trim().toUpperCase();
    if (!trimmed) return;
    if (scannedSerials.includes(trimmed)) {
      alert(`Serial ${trimmed} is already in the dispatch cart.`);
      return;
    }
    setScannedSerials([...scannedSerials, trimmed]);
    setBarcodeInput("");
  };

  const handleRemoveSerial = (sn: string) => {
    setScannedSerials(scannedSerials.filter((s) => s !== sn));
  };

  const handleConfirmDispatch = async () => {
    if (!selectedOrder) return;
    if (scannedSerials.length === 0) {
      alert("Please scan or assign at least one serialized equipment (Inverter / Panels) to complete dispatch.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.confirmDispatch({
        order_id: selectedOrder.order_id,
        scanned_serials: scannedSerials,
        driver_name: driverName,
        vehicle_number: vehicleNumber,
      });

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      setDispatchSuccess(res.message || "Dispatch confirmed! Installation project has been launched.");
      setScannedSerials([]);
      await fetchReadyOrders();
    } catch (err: any) {
      alert("Dispatch failed: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Warehouse Dispatch & QR Serial Gate</h1>
              <p className="text-sm text-slate-400">
                Verify advance payments, scan BOM equipment barcodes, and release field installation kits.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchReadyOrders()}
            className="px-4 py-2 text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl border border-slate-700 transition-colors"
          >
            Refresh Queue ({readyOrders.length})
          </button>
        </div>
      </div>

      {dispatchSuccess && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-center justify-between text-emerald-300 text-sm animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{dispatchSuccess}</span>
          </div>
          <button
            onClick={() => setDispatchSuccess(null)}
            className="text-xs text-emerald-400/80 hover:text-emerald-300 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Grid: Orders Ready for Dispatch on Left, Scanning & Verification on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Orders Awaiting Dispatch */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <PackageCheck className="w-4 h-4 text-emerald-400" />
              Eligible Orders ({readyOrders.length})
            </h2>
            <span className="text-xs text-slate-400">Advance Paid &gt; 30% or Credit Override</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400 bg-slate-900/40 rounded-xl border border-slate-800">
              Loading orders...
            </div>
          ) : readyOrders.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/40 rounded-xl border border-slate-800">
              <CheckCircle2 className="w-10 h-10 text-emerald-400/50 mx-auto mb-2" />
              <p className="text-slate-300 font-medium">All eligible orders have been dispatched!</p>
              <p className="text-xs text-slate-400 mt-1">
                New orders will appear here automatically when customer advance payment is confirmed.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {readyOrders.map((order) => {
                const isSelected = selectedOrder?.order_id === order.order_id;
                return (
                  <div
                    key={order.order_id}
                    onClick={() => {
                      setSelectedOrder(order);
                      setScannedSerials([]);
                      setDispatchSuccess(null);
                    }}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-slate-800/90 border-emerald-500/50 ring-1 ring-emerald-500/30 shadow-lg shadow-emerald-500/5"
                        : "bg-slate-900/50 border-slate-800/80 hover:bg-slate-800/40 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{order.order_number}</span>
                          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {order.system_capacity_kw} kW {order.system_type}
                          </span>
                        </div>
                        <p className="text-sm text-slate-300 font-medium mt-1">{order.customer_name}</p>
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <Building className="w-3 h-3 text-slate-400" />
                          {order.customer_address}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-emerald-400 font-medium block">
                          ₹{order.advance_paid?.toLocaleString()} Paid
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Req: ₹{order.advance_required?.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                      <span>BOM Items: {order.required_components?.length || 0} types</span>
                      <span className="text-emerald-400 flex items-center gap-1">
                        Select to Dispatch <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Dispatch Assembly & Barcode Scanning */}
        <div className="lg:col-span-7">
          {selectedOrder ? (
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-6">
              {/* Order Header Summary */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div>
                  <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                    Dispatch Assembly Station
                  </div>
                  <h3 className="text-lg font-bold text-white mt-0.5">
                    Order {selectedOrder.order_number} — {selectedOrder.customer_name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {selectedOrder.package_name || `${selectedOrder.system_capacity_kw} kW System`} • Delivery Address: {selectedOrder.customer_address}
                  </p>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs border border-slate-700 text-slate-300">
                  Phone: <span className="text-white font-mono">{selectedOrder.customer_phone}</span>
                </div>
              </div>

              {/* Required BOM Components for this Order */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  Bill of Materials (BOM) Requirements
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedOrder.required_components?.map((c: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-medium text-slate-200 block">{c.product_name}</span>
                        <span className="text-[10px] text-slate-400 uppercase">{c.category}</span>
                      </div>
                      <div className="font-mono font-semibold text-amber-400">
                        {c.quantity} {c.unit}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Barcode / QR Scanner Input */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-emerald-400" />
                    Scan / Enter Serial Barcode
                  </label>
                  <span className="text-xs text-slate-400">
                    {scannedSerials.length} serials attached
                  </span>
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Barcode className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Scan with handheld scanner or type serial e.g. INV-H-2026-001..."
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleAddSerial(barcodeInput);
                        }
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <button
                    onClick={() => handleAddSerial(barcodeInput)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    Add Serial
                  </button>
                </div>

                {/* Quick Add Helper from Available Serials in DB */}
                {availableSerials.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[11px] text-slate-400 block mb-1">
                      Quick assign available in-stock inventory serials:
                    </span>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                      {availableSerials.slice(0, 10).map((s) => (
                        <button
                          key={s.id}
                          onClick={() => handleAddSerial(s.serial_number)}
                          disabled={scannedSerials.includes(s.serial_number)}
                          className={`text-[10px] px-2 py-1 rounded font-mono transition-colors ${
                            scannedSerials.includes(s.serial_number)
                              ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                              : "bg-slate-800/80 hover:bg-emerald-600/30 text-slate-300 hover:text-emerald-300 border border-slate-700"
                          }`}
                        >
                          + {s.serial_number} ({s.category?.slice(0, 3)})
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Scanned Serials List */}
              {scannedSerials.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Dispatched Serial Manifest ({scannedSerials.length})
                  </h4>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {scannedSerials.map((sn, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-950/80 border border-emerald-500/20 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="font-mono text-emerald-300 font-medium">{sn}</span>
                        </div>
                        <button
                          onClick={() => handleRemoveSerial(sn)}
                          className="text-[11px] text-rose-400 hover:text-rose-300"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Logistics & Driver Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Assigned Driver / Logistics Lead</label>
                  <input
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Dispatch Vehicle Number</label>
                  <input
                    type="text"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              {/* Automation Note */}
              <div className="p-3 rounded-lg bg-blue-950/30 border border-blue-500/20 flex items-start gap-2 text-xs text-blue-300">
                <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>
                  Confirming dispatch will automatically deduct warehouse stock, assign serial numbers to customer order{" "}
                  <strong>{selectedOrder.order_number}</strong>, and initiate the 13-step Field Installation Project!
                </span>
              </div>

              {/* Submit Dispatch Button */}
              <button
                onClick={handleConfirmDispatch}
                disabled={submitting || scannedSerials.length === 0}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all"
              >
                {submitting ? (
                  "Processing Dispatch..."
                ) : (
                  <>
                    <Truck className="w-4 h-4" />
                    Authorize &amp; Complete Warehouse Dispatch
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800 text-slate-400">
              Select an order on the left to begin warehouse packing &amp; dispatch.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
