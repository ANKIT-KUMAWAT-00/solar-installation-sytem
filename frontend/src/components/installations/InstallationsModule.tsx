"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Wrench,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileCheck,
  Camera,
  PenTool,
  ShieldCheck,
  Building,
  User,
  Phone,
  Zap,
  Layers,
  ChevronRight,
  Sparkles,
  Award,
  Maximize2
} from "lucide-react";
import { api } from "@/lib/api";
import confetti from "canvas-confetti";

export default function InstallationsModule() {
  const [installations, setInstallations] = useState<any[]>([]);
  const [selectedInst, setSelectedInst] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [activeTab, setActiveTab] = useState<"TASKS" | "SIGNATURE" | "EQUIPMENT">("TASKS");

  // Signature canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [acceptanceNotes, setAcceptanceNotes] = useState(
    "Customer inspected the complete rooftop installation, confirmed inverter energization, generation on net meter, and received full warranty briefing."
  );
  const [submittingAcceptance, setSubmittingAcceptance] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  useEffect(() => {
    fetchInstallations();
  }, []);

  const fetchInstallations = async () => {
    setLoading(true);
    try {
      const data = await api.getInstallations();
      setInstallations(data || []);
      if (data && data.length > 0) {
        // Fetch detailed record for first item
        const detail = await api.getInstallationDetail(data[0].id);
        setSelectedInst(detail);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectInstallation = async (id: number) => {
    try {
      const detail = await api.getInstallationDetail(id);
      setSelectedInst(detail);
      setHasSignature(false);
      clearCanvas();
      setSuccessBanner(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleTaskToggle = async (taskId: number, currentStatus: string) => {
    if (!selectedInst) return;
    const newStatus = currentStatus === "COMPLETED" ? "PENDING" : "COMPLETED";

    try {
      await api.updateTaskProgress(selectedInst.id, taskId, {
        status: newStatus,
        notes: newStatus === "COMPLETED" ? "Verified and checked off by Lead Field Technician." : "",
      });

      // Update local state
      const updatedTasks = selectedInst.tasks.map((t: any) =>
        t.id === taskId ? { ...t, status: newStatus } : t
      );
      setSelectedInst({ ...selectedInst, tasks: updatedTasks });
    } catch (err: any) {
      alert("Failed to update task: " + err.message);
    }
  };

  // Canvas drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    setHasSignature(true);
    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#10B981"; // Emerald stroke
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleCustomerAcceptance = async () => {
    if (!selectedInst) return;
    if (!hasSignature && !selectedInst.customer_signature_svg) {
      alert("Please capture the customer's digital signature before finalizing commissioning.");
      return;
    }

    setSubmittingAcceptance(true);
    try {
      const canvas = canvasRef.current;
      const signatureDataUrl = canvas ? canvas.toDataURL("image/png") : "";
      const signatureSvg = `<svg viewBox="0 0 400 120" xmlns="http://www.w3.org/2000/svg"><image href="${signatureDataUrl}" width="400" height="120"/></svg>`;

      const res = await api.customerAcceptance(selectedInst.id, {
        signature_svg: signatureSvg,
        notes: acceptanceNotes,
      });

      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });

      setSuccessBanner(res.message);
      // Refresh details
      const detail = await api.getInstallationDetail(selectedInst.id);
      setSelectedInst(detail);
      await fetchInstallations();
    } catch (err: any) {
      alert("Failed to confirm customer acceptance: " + err.message);
    } finally {
      setSubmittingAcceptance(false);
    }
  };

  const filteredInstallations = installations.filter((i) => {
    if (statusFilter === "ALL") return true;
    return i.status === statusFilter;
  });

  const completedTasksCount =
    selectedInst?.tasks?.filter((t: any) => t.status === "COMPLETED").length || 0;
  const totalTasksCount = selectedInst?.tasks?.length || 13;
  const progressPercent = Math.round((completedTasksCount / totalTasksCount) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Field Operations &amp; 13-Step Installation Checklist
              </h1>
              <p className="text-sm text-slate-400">
                Live field crew execution, standard SOP quality verification, digital customer sign-off, and auto warranty activation.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {["ALL", "DISPATCHED", "WORK_STARTED", "COMMISSIONED", "CUSTOMER_ACCEPTED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                statusFilter === st
                  ? "bg-teal-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:text-slate-300"
              }`}
            >
              {st.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {successBanner && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-center justify-between text-emerald-300 text-sm animate-in fade-in">
          <div className="flex items-center gap-3">
            <Award className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{successBanner}</span>
          </div>
          <button
            onClick={() => setSuccessBanner(null)}
            className="text-xs text-emerald-400/80 hover:text-emerald-300 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Project List */}
        <div className="lg:col-span-4 space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Installation Projects ({filteredInstallations.length})
          </h2>

          {loading ? (
            <div className="p-8 text-center text-slate-400 bg-slate-900/40 rounded-xl border border-slate-800">
              Loading projects...
            </div>
          ) : filteredInstallations.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/40 rounded-xl border border-slate-800 text-slate-400">
              No projects found in this status.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
              {filteredInstallations.map((inst) => {
                const isSelected = selectedInst?.id === inst.id;
                return (
                  <div
                    key={inst.id}
                    onClick={() => handleSelectInstallation(inst.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-slate-800/90 border-teal-500/50 ring-1 ring-teal-500/30 shadow-lg shadow-teal-500/5"
                        : "bg-slate-900/50 border-slate-800/80 hover:bg-slate-800/40 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white text-sm">
                            {inst.installation_code}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                            {inst.order_number}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 font-medium mt-1">{inst.customer_name}</p>
                        <p className="text-[11px] text-slate-400">{inst.customer_address}</p>
                      </div>

                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                          inst.status === "CUSTOMER_ACCEPTED"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : inst.status === "COMMISSIONED"
                            ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                            : inst.status === "WORK_STARTED"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : "bg-slate-800 text-slate-300 border-slate-700"
                        }`}
                      >
                        {inst.status?.replace(/_/g, " ")}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
                      <span>{inst.system_capacity_kw} kW System</span>
                      <span className="text-teal-400 flex items-center gap-0.5">
                        Inspect <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Execution Workspace */}
        <div className="lg:col-span-8">
          {selectedInst ? (
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-6">
              {/* Project Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-teal-400 uppercase tracking-wider">
                      Installation Project Details
                    </span>
                    {selectedInst.commissioning_certificate_no && (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono">
                        {selectedInst.commissioning_certificate_no}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-white mt-1">
                    {selectedInst.installation_code} — {selectedInst.customer?.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                    <span className="flex items-center gap-1">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      {selectedInst.customer?.address}, {selectedInst.customer?.city}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-mono">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {selectedInst.customer?.phone}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  <span className="text-xs text-slate-400">Capacity &amp; Type</span>
                  <span className="text-base font-bold text-amber-400">
                    {selectedInst.system_capacity_kw} kW {selectedInst.system_type}
                  </span>
                </div>
              </div>

              {/* Checklist Progress Bar */}
              <div className="space-y-2 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">
                    Checklist Completion: {completedTasksCount} of {totalTasksCount} Steps
                  </span>
                  <span className="font-mono font-bold text-teal-400">{progressPercent}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-teal-500 to-emerald-400 h-full rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Sub-Tabs: Tasks Checklist | Digital Signature | Installed Serials */}
              <div className="flex border-b border-slate-800 gap-6 text-sm">
                <button
                  onClick={() => setActiveTab("TASKS")}
                  className={`pb-3 font-semibold transition-colors border-b-2 flex items-center gap-2 ${
                    activeTab === "TASKS"
                      ? "text-teal-400 border-teal-400"
                      : "text-slate-400 border-transparent hover:text-slate-300"
                  }`}
                >
                  <FileCheck className="w-4 h-4" />
                  13-Step SOP Checklist
                </button>
                <button
                  onClick={() => setActiveTab("SIGNATURE")}
                  className={`pb-3 font-semibold transition-colors border-b-2 flex items-center gap-2 ${
                    activeTab === "SIGNATURE"
                      ? "text-emerald-400 border-emerald-400"
                      : "text-slate-400 border-transparent hover:text-slate-300"
                  }`}
                >
                  <PenTool className="w-4 h-4" />
                  Customer Acceptance &amp; Signature
                </button>
                <button
                  onClick={() => setActiveTab("EQUIPMENT")}
                  className={`pb-3 font-semibold transition-colors border-b-2 flex items-center gap-2 ${
                    activeTab === "EQUIPMENT"
                      ? "text-amber-400 border-amber-400"
                      : "text-slate-400 border-transparent hover:text-slate-300"
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  Commissioned Serials ({selectedInst.installed_equipment?.length || 0})
                </button>
              </div>

              {/* TAB 1: 13-Step Checklist */}
              {activeTab === "TASKS" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Click any step to mark complete / verified in real-time</span>
                    <span>Lead Field Crew Lead: Assigned</span>
                  </div>

                  <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                    {selectedInst.tasks?.map((task: any) => {
                      const isCompleted = task.status === "COMPLETED";
                      return (
                        <div
                          key={task.id}
                          onClick={() => handleTaskToggle(task.id, task.status)}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                            isCompleted
                              ? "bg-teal-950/20 border-teal-500/30 text-teal-300"
                              : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                isCompleted
                                  ? "bg-teal-500 text-slate-950"
                                  : "bg-slate-800 text-slate-400"
                              }`}
                            >
                              {isCompleted ? "✓" : task.step_order}
                            </div>
                            <div>
                              <p
                                className={`text-xs font-medium ${
                                  isCompleted ? "line-through text-slate-400" : "text-slate-200"
                                }`}
                              >
                                {task.step_name}
                              </p>
                              {task.notes && (
                                <p className="text-[10px] text-teal-400/80 mt-0.5">{task.notes}</p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                                isCompleted
                                  ? "bg-teal-500/20 text-teal-300"
                                  : "bg-slate-800 text-slate-400"
                              }`}
                            >
                              {task.status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 2: Customer Acceptance & Digital Signature Pad */}
              {activeTab === "SIGNATURE" && (
                <div className="space-y-5">
                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold text-white">Digital Customer Handover Protocol</h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        The customer must physically sign below to acknowledge satisfactory installation, inverter energization, and activation of warranty policies.
                      </p>
                    </div>

                    {/* Canvas Area */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <label className="text-slate-300 font-medium">Customer Signature Pad</label>
                        <button
                          type="button"
                          onClick={clearCanvas}
                          className="text-xs text-rose-400 hover:text-rose-300 underline"
                        >
                          Clear Pad
                        </button>
                      </div>

                      <div className="relative border-2 border-dashed border-slate-700 rounded-xl bg-slate-900/90 overflow-hidden">
                        <canvas
                          ref={canvasRef}
                          width={600}
                          height={160}
                          onMouseDown={startDrawing}
                          onMouseMove={draw}
                          onMouseUp={stopDrawing}
                          onMouseLeave={stopDrawing}
                          onTouchStart={startDrawing}
                          onTouchMove={draw}
                          onTouchEnd={stopDrawing}
                          className="w-full h-40 cursor-crosshair touch-none"
                        />
                        {!hasSignature && !selectedInst.customer_signature_svg && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-600 text-xs font-mono">
                            ✍️ Sign here with mouse or finger
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Acceptance Notes */}
                    <div>
                      <label className="text-xs text-slate-300 block mb-1">
                        Handover / Commissioning Notes
                      </label>
                      <textarea
                        rows={2}
                        value={acceptanceNotes}
                        onChange={(e) => setAcceptanceNotes(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={handleCustomerAcceptance}
                      disabled={submittingAcceptance || selectedInst.status === "CUSTOMER_ACCEPTED"}
                      className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all"
                    >
                      {submittingAcceptance ? (
                        "Issuing Commissioning Certificate..."
                      ) : selectedInst.status === "CUSTOMER_ACCEPTED" ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                          Commissioning Complete &amp; Warranties Activated
                        </>
                      ) : (
                        <>
                          <Award className="w-4 h-4" />
                          Record Customer Acceptance &amp; Activate Warranties
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: Commissioned Serials */}
              {activeTab === "EQUIPMENT" && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-400">
                    Physical serialized inventory mapped and installed for this customer:
                  </p>
                  <div className="space-y-2">
                    {selectedInst.installed_equipment?.map((eq: any) => (
                      <div
                        key={eq.id}
                        className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold text-emerald-400">
                              {eq.serial_number}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] uppercase">
                              {eq.category}
                            </span>
                          </div>
                          <p className="text-slate-300 mt-0.5 font-medium">{eq.product_name}</p>
                          <p className="text-[10px] text-slate-500">Mfr: {eq.manufacturer}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 block">
                            {eq.warranty_duration_years || 5} Yr Warranty
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800 text-slate-400">
              Select an installation project on the left to inspect or update.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
