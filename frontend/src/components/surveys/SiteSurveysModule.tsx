"use client";

import React, { useEffect, useState } from "react";
import {
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  Camera,
  Compass,
  ArrowRight,
  ShieldAlert,
  FileCheck
} from "lucide-react";
import { api } from "@/lib/api";

interface SiteSurveysModuleProps {
  onGenerateQuotation?: (surveyId: number, leadId: number, capacityKw: number) => void;
}

export default function SiteSurveysModule({ onGenerateQuotation }: SiteSurveysModuleProps) {
  const [surveys, setSurveys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSurvey, setSelectedSurvey] = useState<any | null>(null);
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");

  useEffect(() => {
    loadSurveys();
  }, []);

  const loadSurveys = async () => {
    try {
      setLoading(true);
      const res = await api.getSurveys();
      setSurveys(res);
      if (res.length > 0 && !selectedSurvey) {
        const detail = await api.getSurveyDetail(res[0].id);
        setSelectedSurvey(detail);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSurvey = async (id: number) => {
    try {
      const detail = await api.getSurveyDetail(id);
      setSelectedSurvey(detail);
    } catch (e) {
      console.error(e);
    }
  };

  const handleApproveSurvey = async (override?: boolean) => {
    if (!selectedSurvey) return;
    try {
      await api.approveSurvey(selectedSurvey.id, override ? overrideReason : undefined);
      setOverrideModalOpen(false);
      setOverrideReason("");
      // Reload
      const detail = await api.getSurveyDetail(selectedSurvey.id);
      setSelectedSurvey(detail);
      loadSurveys();
      alert("Site Survey approved successfully! Quotation generation is now unlocked.");
    } catch (e: any) {
      alert(`Approval error: ${e.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-white flex items-center gap-2.5">
          <ClipboardCheck className="w-5 h-5 text-solar-emerald" /> Rooftop Site Survey & Technical Inspection
        </h1>
        <p className="text-xs text-slate-400">
          Mandatory pre-quotation site feasibility inspection: shadow analysis, roof tilt, cable length & electrical phase verification.
        </p>
      </div>

      {/* Survey Grid & Inspector Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Surveys List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            Site Survey Pipeline ({surveys.length})
          </div>

          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            {surveys.map((s) => {
              const isSelected = selectedSurvey?.id === s.id;
              const isApproved = s.status === "APPROVED";

              return (
                <div
                  key={s.id}
                  onClick={() => handleSelectSurvey(s.id)}
                  className={`glass-panel p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? "border-solar-emerald/80 bg-slate-900/90 shadow-solar-emerald"
                      : "border-solar-border/80 hover:border-slate-600"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-solar-emerald">{s.survey_number}</span>
                      <h3 className="text-sm font-bold text-white">{s.customer_name}</h3>
                      <p className="text-xs text-slate-400">{s.customer_city}</p>
                    </div>

                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${
                        isApproved
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                          : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                      }`}
                    >
                      {s.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-300 mt-2.5 pt-2 border-t border-slate-800">
                    <span className="text-solar-gold font-bold">Rec. {s.recommended_capacity_kw} kW</span>
                    <span className="text-slate-400 text-[11px]">
                      Shadow-Free: {s.shadow_free_area_sqft} sqft
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Survey Detail Inspector (7 cols) */}
        <div className="lg:col-span-7">
          {selectedSurvey ? (
            <div className="glass-panel p-5 rounded-2xl border border-solar-border/80 space-y-5">
              <div className="flex items-start justify-between pb-3 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-solar-emerald font-bold">
                      {selectedSurvey.survey_number}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase ${
                        selectedSurvey.status === "APPROVED"
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                          : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                      }`}
                    >
                      {selectedSurvey.status}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-white mt-1">
                    {selectedSurvey.customer?.name}
                  </h2>
                  <p className="text-xs text-slate-400">{selectedSurvey.customer?.address}, {selectedSurvey.customer?.city}</p>
                </div>

                {/* Approval & Quotation Action */}
                <div className="flex flex-col items-end gap-2">
                  {selectedSurvey.status === "APPROVED" ? (
                    <button
                      onClick={() =>
                        onGenerateQuotation?.(
                          selectedSurvey.id,
                          selectedSurvey.lead_id,
                          selectedSurvey.recommended_capacity_kw
                        )
                      }
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-solar-gold hover:bg-amber-400 text-slate-950 flex items-center gap-1.5 shadow-solar-gold transition-all"
                    >
                      Generate Quotation <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleApproveSurvey(false)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-solar-emerald hover:bg-emerald-400 text-slate-950 flex items-center gap-1.5 transition-all"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve Survey
                      </button>
                      <button
                        onClick={() => setOverrideModalOpen(true)}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
                      >
                        Override...
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Technical Specifications Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800">
                  <div className="text-[10px] text-slate-400">Shadow-Free Area</div>
                  <div className="text-sm font-bold text-white mt-0.5">{selectedSurvey.shadow_free_area_sqft} sq.ft</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800">
                  <div className="text-[10px] text-slate-400">Roof Direction / Tilt</div>
                  <div className="text-sm font-bold text-white mt-0.5">{selectedSurvey.roof_direction} • {selectedSurvey.roof_tilt_deg}°</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800">
                  <div className="text-[10px] text-slate-400">Cable Distance</div>
                  <div className="text-sm font-bold text-white mt-0.5">{selectedSurvey.cable_distance_meters} Meters</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800">
                  <div className="text-[10px] text-slate-400">Sanctioned Load</div>
                  <div className="text-sm font-bold text-solar-emerald mt-0.5">{selectedSurvey.existing_sanctioned_load_kw} kW ({selectedSurvey.grid_connection_phase})</div>
                </div>
              </div>

              {/* Observations */}
              {selectedSurvey.technician_observations && (
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                  <div className="text-slate-400 font-semibold mb-1">Technician Observations:</div>
                  <p className="text-slate-300">{selectedSurvey.technician_observations}</p>
                </div>
              )}

              {/* Photo Evidence Gallery */}
              <div>
                <div className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-solar-emerald" /> Site Inspection Photographs ({selectedSurvey.photos?.length || 0})
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  {selectedSurvey.photos?.map((p: any) => (
                    <div key={p.id} className="group relative rounded-xl overflow-hidden border border-slate-800 aspect-video bg-slate-900">
                      <img src={p.photo_url} alt={p.caption} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-x-0 bottom-0 p-1 bg-slate-950/80 text-[10px] text-slate-300 truncate">
                        {p.caption || p.photo_type}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Business Rule Warning Note */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2 text-xs">
                <ShieldAlert className="w-4 h-4 text-solar-gold flex-shrink-0 mt-0.5" />
                <span className="text-slate-300">
                  <strong className="text-amber-400">Business Integrity Enforcement:</strong> Quotation approval is locked until rooftop site survey is officially approved to prevent incorrect hardware or shadow loss calculations.
                </span>
              </div>
            </div>
          ) : (
            <div className="glass-panel p-10 rounded-2xl border border-solar-border/80 flex items-center justify-center text-slate-400 text-xs">
              Select a survey to view technical inspection findings.
            </div>
          )}
        </div>
      </div>

      {/* Manager Override Modal */}
      {overrideModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-solar-border shadow-2xl p-5 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-solar-gold" /> Manager Survey Override
            </h3>
            <p className="text-xs text-slate-400">
              Provide mandatory justification to approve quotation before on-site inspection completion (will be recorded in audit log):
            </p>
            <textarea
              rows={3}
              required
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              placeholder="e.g. Architect building CAD blueprints & shadow drone scan already provided by customer."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setOverrideModalOpen(false)} className="px-3 py-1.5 text-xs text-slate-400">
                Cancel
              </button>
              <button
                disabled={!overrideReason.trim()}
                onClick={() => handleApproveSurvey(true)}
                className="px-4 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl shadow-solar-gold disabled:opacity-50"
              >
                Confirm Override
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
