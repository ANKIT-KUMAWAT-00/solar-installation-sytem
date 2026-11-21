"use client";

import React, { useEffect, useState } from "react";
import {
  Package,
  Layers,
  Sparkles,
  Calculator,
  CheckCircle2,
  Cpu,
  Battery,
  Shield,
  Zap
} from "lucide-react";
import { api } from "@/lib/api";
import ExplodedBOM3D from "@/components/3d/ExplodedBOM3D";

export default function PackagesBOMModule() {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Dynamic Calculator State
  const [calcType, setCalcType] = useState<string>("ON_GRID");
  const [calcCapacity, setCalcCapacity] = useState<number>(3.0);
  const [calculatedBOM, setCalculatedBOM] = useState<any | null>(null);

  useEffect(() => {
    loadPackages();
    runBOMCalculation(calcType, calcCapacity);
  }, []);

  const loadPackages = async () => {
    try {
      setLoading(true);
      const res = await api.getPackages();
      setPackages(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const runBOMCalculation = async (type: string, kw: number) => {
    try {
      const res = await api.calculateBOM(type, kw);
      setCalculatedBOM(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleTypeChange = (type: string) => {
    setCalcType(type);
    runBOMCalculation(type, calcCapacity);
  };

  const handleCapacityChange = (kw: number) => {
    setCalcCapacity(kw);
    runBOMCalculation(calcType, kw);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-white flex items-center gap-2.5">
          <Package className="w-5 h-5 text-solar-emerald" /> Solar Packages & Automated Bill of Materials (BOM)
        </h1>
        <p className="text-xs text-slate-400">
          Predefined standard engineering packages (1 kW to 5 kW On-Grid & Off-Grid) with automated material requirement calculation.
        </p>
      </div>

      {/* 3D Exploded BOM Interactive View */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-solar-gold" />
            Interactive 3D Exploded Rooftop Solar Engineering Architecture
          </h2>
          <span className="text-xs text-slate-400">Drag to inspect mechanical & electrical layers</span>
        </div>
        <ExplodedBOM3D systemType={calcType} capacityKw={calcCapacity} />
      </div>

      {/* Dynamic BOM Configuration Engine */}
      <div className="glass-panel p-5 rounded-2xl border border-solar-border/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Calculator className="w-4 h-4 text-solar-emerald" /> Dynamic BOM Template Generator
            </h3>
            <p className="text-xs text-slate-400">Tweak capacity to automatically generate component breakdown</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleTypeChange("ON_GRID")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                calcType === "ON_GRID"
                  ? "bg-solar-emerald text-slate-950 shadow-solar-emerald"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              On-Grid Systems
            </button>
            <button
              onClick={() => handleTypeChange("OFF_GRID")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                calcType === "OFF_GRID"
                  ? "bg-solar-gold text-slate-950 shadow-solar-gold"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              Off-Grid (Battery Bank)
            </button>
          </div>
        </div>

        {/* Capacity Selector Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[1.0, 2.0, 3.0, 4.0, 5.0].map((kw) => (
            <button
              key={kw}
              onClick={() => handleCapacityChange(kw)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                calcCapacity === kw
                  ? "bg-gradient-to-r from-solar-emerald to-emerald-600 text-slate-950 shadow-solar-emerald"
                  : "bg-slate-900/80 border border-slate-800 text-slate-300 hover:border-slate-600"
              }`}
            >
              {kw} kW Package {kw === 3.0 && "(PM Surya Ghar)"}
            </button>
          ))}
        </div>

        {/* Generated Bill of Materials Table */}
        {calculatedBOM && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2.5 px-3">Component Description</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3 text-right">Qty</th>
                  <th className="py-2.5 px-3 text-right">Unit Cost</th>
                  <th className="py-2.5 px-3 text-right">Hardware Selling</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {calculatedBOM.items.map((item: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-medium text-white">{item.item_name}</td>
                    <td className="py-2.5 px-3 text-slate-400 text-[11px]">{item.category}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-solar-emerald">{item.quantity} {item.unit}</td>
                    <td className="py-2.5 px-3 text-right text-slate-400 font-mono">₹{item.unit_cost.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-white font-mono">₹{item.total_price.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-700 bg-slate-900/60 font-bold">
                  <td colSpan={3} className="py-3 px-3 text-white">Turnkey Hardware & Labour Total:</td>
                  <td className="py-3 px-3 text-right text-slate-400 font-mono">BOM Cost: ₹{calculatedBOM.total_material_cost.toLocaleString()}</td>
                  <td className="py-3 px-3 text-right text-solar-gold font-mono text-sm">Suggested Sell: ₹{calculatedBOM.suggested_selling_price.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Predefined Package Catalogue Grid */}
      <div>
        <h3 className="text-sm font-bold text-white mb-3">Predefined Standard Solar Catalogue</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className="glass-panel glass-panel-hover p-4 rounded-2xl border border-solar-border/80 flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono text-solar-emerald font-bold">{pkg.code}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-solar-gold border border-slate-700">
                    {pkg.system_type.replace("_", " ")}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white">{pkg.name}</h4>
                <p className="text-xs text-slate-400 mt-1">{pkg.description}</p>
              </div>

              <div className="space-y-1.5 pt-3 border-t border-slate-800 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Base Hardware BOM:</span>
                  <span className="font-mono text-white">₹{pkg.base_material_cost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Installation Service:</span>
                  <span className="font-mono text-white">₹{pkg.default_installation_charge.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-200 font-bold pt-1 border-t border-slate-800/80">
                  <span>Turnkey Price:</span>
                  <span className="text-solar-gold font-mono text-sm">₹{pkg.selling_price.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
