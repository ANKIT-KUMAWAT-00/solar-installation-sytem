"use client";

import React, { useState } from "react";
import {
  Sun,
  Calculator,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Building,
  User,
  Phone,
  Mail,
  MapPin,
  TrendingDown
} from "lucide-react";
import { api } from "@/lib/api";
import confetti from "canvas-confetti";

export default function PublicEnquiryModule() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("Pune");
  const [address, setAddress] = useState("");
  const [monthlyBill, setMonthlyBill] = useState(3500);
  const [capacityKw, setCapacityKw] = useState(3.0);
  const [systemType, setSystemType] = useState("ON_GRID");
  const [roofType, setRoofType] = useState("CONCRETE_FLAT");
  const [subsidyNeeded, setSubsidyNeeded] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [submittedResult, setSubmittedResult] = useState<any | null>(null);

  // Estimator Calculations
  const grossPrice = capacityKw * 65000;
  let estimatedSubsidy = 0;
  if (subsidyNeeded && systemType === "ON_GRID") {
    if (capacityKw <= 1) estimatedSubsidy = 30000;
    else if (capacityKw <= 2) estimatedSubsidy = 60000;
    else estimatedSubsidy = 78000;
  }
  const netEstimatedPrice = Math.max(0, grossPrice - estimatedSubsidy);
  const estimatedMonthlyUnits = Math.round(capacityKw * 125);
  const estimatedMonthlySavings = Math.round(estimatedMonthlyUnits * 9.5); // ₹9.5/unit average DISCOM slab
  const paybackPeriodYears = (netEstimatedPrice / (estimatedMonthlySavings * 12)).toFixed(1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.submitPublicEnquiry({
        full_name: fullName,
        phone,
        email: email || undefined,
        city,
        address: address || `${city}, Maharashtra`,
        monthly_electricity_bill: monthlyBill,
        requested_capacity_kw: capacityKw,
        preferred_system_type: systemType,
        roof_type: roofType,
        requires_subsidy: subsidyNeeded,
      });

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      setSubmittedResult(res);
    } catch (err: any) {
      alert("Enquiry submission failed: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-emerald-950/40 p-6 md:p-8 rounded-3xl border border-amber-500/20 shadow-2xl text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          PM Surya Ghar: Muft Bijli Yojana Authorized Channel Partner
        </div>
        <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">
          Calculate Your Rooftop Solar Savings &amp; Subsidy
        </h1>
        <p className="text-xs md:text-sm text-slate-300 max-w-2xl mx-auto">
          Get an instant rooftop solar proposal with tier-1 bifacial panels, 10-year inverter warranty, and government DBT subsidy directly deposited into your bank.
        </p>
      </div>

      {submittedResult ? (
        <div className="bg-slate-900/80 border border-emerald-500/40 rounded-3xl p-8 text-center space-y-6 shadow-2xl animate-in zoom-in-95">
          <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/40">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-white">Thank You, {fullName}!</h2>
            <p className="text-sm text-emerald-400 font-medium">
              Your Solar Enquiry #{submittedResult.lead_id || "LEAD-2026"} has been recorded.
            </p>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-2">
              Our certified site survey engineer will contact you on <span className="text-white font-mono">{phone}</span> within 2 hours to schedule your free shadow analysis.
            </p>
          </div>

          {/* Quotation Summary Card */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 max-w-xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <span className="text-xs text-slate-400 block">System Size</span>
              <span className="text-lg font-bold text-white font-mono mt-1 block">
                {capacityKw} kW
              </span>
              <span className="text-[10px] text-slate-500">{systemType}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Est. Subsidy</span>
              <span className="text-lg font-bold text-emerald-400 font-mono mt-1 block">
                ₹{estimatedSubsidy.toLocaleString()}
              </span>
              <span className="text-[10px] text-emerald-500/80">Direct DBT</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Net Price</span>
              <span className="text-lg font-bold text-amber-400 font-mono mt-1 block">
                ₹{netEstimatedPrice.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500">All-Inclusive</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Monthly Savings</span>
              <span className="text-lg font-bold text-teal-400 font-mono mt-1 block">
                ₹{estimatedMonthlySavings.toLocaleString()}
              </span>
              <span className="text-[10px] text-teal-500/80">Every Month</span>
            </div>
          </div>

          <button
            onClick={() => {
              setSubmittedResult(null);
              setFullName("");
              setPhone("");
            }}
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
          >
            Calculate for Another Property
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Input Form */}
          <div className="lg:col-span-7 bg-slate-900/70 border border-slate-800 rounded-3xl p-6 md:p-7 space-y-5">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Calculator className="w-5 h-5 text-amber-400" />
              Property &amp; Electricity Details
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Anand Kulkarni"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Mobile Number (WhatsApp) *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">City / Region *</label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Pune">Pune</option>
                    <option value="Pimpri-Chinchwad">Pimpri-Chinchwad</option>
                    <option value="Mumbai">Mumbai</option>
                    <option value="Nashik">Nashik</option>
                    <option value="Satara">Satara</option>
                    <option value="Kolhapur">Kolhapur</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Average Monthly Bill (₹)</label>
                  <input
                    type="number"
                    min={500}
                    step={100}
                    value={monthlyBill}
                    onChange={(e) => setMonthlyBill(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              {/* Slider for System Capacity */}
              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-semibold">Recommended Solar Capacity</label>
                  <span className="text-base font-bold text-amber-400 font-mono">{capacityKw} kW</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="0.5"
                  value={capacityKw}
                  onChange={(e) => setCapacityKw(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>1 kW (100 sq.ft)</span>
                  <span>2 kW (200 sq.ft)</span>
                  <span>3 kW (300 sq.ft)</span>
                  <span>4 kW (400 sq.ft)</span>
                  <span>5 kW (500 sq.ft)</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">System Architecture</label>
                  <select
                    value={systemType}
                    onChange={(e) => setSystemType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white"
                  >
                    <option value="ON_GRID">On-Grid (Net Metering with DISCOM)</option>
                    <option value="OFF_GRID">Off-Grid (With Lithium Battery Bank)</option>
                    <option value="HYBRID">Hybrid (Grid + Battery Storage)</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Roof Type</label>
                  <select
                    value={roofType}
                    onChange={(e) => setRoofType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white"
                  >
                    <option value="CONCRETE_FLAT">RCC Flat Concrete Roof</option>
                    <option value="TIN_SHED">Industrial Metal Sheet / Tin Shed</option>
                    <option value="TILED_SLOPE">Mangalore Tiled Sloped Roof</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 text-sm flex items-center justify-center gap-2 transition-all mt-3"
              >
                {submitting ? (
                  "Submitting Proposal..."
                ) : (
                  <>
                    <span>Request Free Site Survey &amp; Official Proposal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right: Live Savings Calculation Preview */}
          <div className="lg:col-span-5 bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 md:p-7 space-y-5">
            <div>
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">
                Estimated System Economics
              </span>
              <h3 className="text-lg font-bold text-white mt-0.5">
                {capacityKw} kW {systemType.replace(/_/g, " ")} System
              </h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs py-2 border-b border-slate-800">
                <span className="text-slate-400">Total System Turnkey Cost</span>
                <span className="font-mono font-semibold text-white">₹{grossPrice.toLocaleString()}</span>
              </div>

              <div className="flex items-center justify-between text-xs py-2 border-b border-slate-800">
                <span className="text-emerald-400 font-medium">PM Surya Ghar Subsidy (DBT)</span>
                <span className="font-mono font-bold text-emerald-400">
                  - ₹{estimatedSubsidy.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm py-2 border-b border-slate-800 font-bold">
                <span className="text-white">Your Net Investment</span>
                <span className="font-mono text-amber-400 text-base">
                  ₹{netEstimatedPrice.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Savings Box */}
            <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-300 font-semibold">
                <TrendingDown className="w-4 h-4 text-emerald-400" />
                <span>Estimated Return on Investment</span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                Produces ~<strong>{estimatedMonthlyUnits} units</strong> per month. Reduces your electricity bill by ~
                <strong className="text-emerald-300 font-mono">₹{estimatedMonthlySavings.toLocaleString()}</strong> every month!
              </p>
              <div className="pt-2 border-t border-emerald-500/20 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Estimated Payback Period:</span>
                <span className="font-mono font-bold text-emerald-400">{paybackPeriodYears} Years</span>
              </div>
            </div>

            {/* Guarantees */}
            <div className="space-y-2 text-[11px] text-slate-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>25-Year Performance Warranty on Solar PV Modules</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>10-Year Inverter Warranty &amp; Certified DISCOM Net Metering</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
