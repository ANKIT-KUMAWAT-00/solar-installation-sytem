"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Wrench,
  Phone,
  Mail,
  MapPin,
  CheckCircle,
  Clock,
  Search,
  Filter,
  Shield,
  Zap,
  Activity,
  HardHat
} from "lucide-react";
import { api } from "@/lib/api";

export default function TechniciansModule() {
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("ALL");
  const [availabilityFilter, setAvailabilityFilter] = useState("ALL");

  useEffect(() => {
    fetchTechnicians();
  }, []);

  const fetchTechnicians = async () => {
    setLoading(true);
    try {
      const data = await api.getTechnicians();
      setTechnicians(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const regions = ["ALL", ...Array.from(new Set(technicians.map((t) => t.assigned_region)))];

  const filtered = technicians.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.employee_id.toLowerCase().includes(search.toLowerCase()) ||
      t.skills.toLowerCase().includes(search.toLowerCase());
    const matchesRegion = selectedRegion === "ALL" || t.assigned_region === selectedRegion;
    const matchesAvailability =
      availabilityFilter === "ALL" ||
      (availabilityFilter === "AVAILABLE" && t.is_available) ||
      (availabilityFilter === "BUSY" && !t.is_available);
    return matchesSearch && matchesRegion && matchesAvailability;
  });

  const availableCount = technicians.filter((t) => t.is_available).length;
  const busyCount = technicians.filter((t) => !t.is_available).length;
  const totalJobs = technicians.reduce((acc, t) => acc + (t.active_jobs_count || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <HardHat className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">15 Field Technicians &amp; Crew Roster</h1>
              <p className="text-sm text-slate-400">
                Track certified installation leads, high-voltage technicians, assigned territories, and live workload.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchTechnicians()}
            className="px-4 py-2 text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl border border-slate-700 transition-colors"
          >
            Refresh Roster
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Total Tech Crew</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">{technicians.length}</div>
          <span className="text-[11px] text-slate-400">100% DISCOM Safety Certified</span>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-400">Available for Dispatch</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-2">{availableCount}</div>
          <span className="text-[11px] text-emerald-400/80">Ready for instant assignment</span>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-400">On-Site Active Jobs</span>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-2">{busyCount}</div>
          <span className="text-[11px] text-amber-400/80">Across {totalJobs} rooftop projects</span>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-cyan-400">Territories Covered</span>
            <MapPin className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-400 mt-2">{regions.length - 1}</div>
          <span className="text-[11px] text-cyan-400/80">Maharashtra West Hub</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, ID, or skill..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Availability Filter */}
          <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs">
            <button
              onClick={() => setAvailabilityFilter("ALL")}
              className={`px-3 py-1 rounded-md transition-colors ${
                availabilityFilter === "ALL" ? "bg-slate-800 text-white font-medium" : "text-slate-400 hover:text-slate-300"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setAvailabilityFilter("AVAILABLE")}
              className={`px-3 py-1 rounded-md transition-colors ${
                availabilityFilter === "AVAILABLE"
                  ? "bg-emerald-600/40 text-emerald-300 font-medium"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              Available ({availableCount})
            </button>
            <button
              onClick={() => setAvailabilityFilter("BUSY")}
              className={`px-3 py-1 rounded-md transition-colors ${
                availabilityFilter === "BUSY"
                  ? "bg-amber-600/40 text-amber-300 font-medium"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              On-Site ({busyCount})
            </button>
          </div>

          {/* Region Dropdown */}
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none"
          >
            {regions.map((reg) => (
              <option key={reg} value={reg}>
                Region: {reg}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Technicians Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 bg-slate-900/30 rounded-2xl border border-slate-800">
          Loading technicians roster...
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-slate-900/30 rounded-2xl border border-slate-800">
          No technicians match your filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((tech) => (
            <div
              key={tech.id}
              className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 space-y-4 transition-all hover:shadow-xl hover:shadow-amber-500/5"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-base">{tech.name}</span>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {tech.employee_id}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span>{tech.assigned_region}</span>
                  </div>
                </div>

                <div
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border ${
                    tech.is_available
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${tech.is_available ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`}
                  />
                  {tech.is_available ? "Available" : "On-Site"}
                </div>
              </div>

              {/* Skills Badges */}
              <div>
                <span className="text-[11px] text-slate-500 uppercase tracking-wider block mb-1.5">
                  Core Skills &amp; Certifications
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {tech.skills?.split(",").map((skill: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-slate-950 text-slate-300 text-[11px] border border-slate-800"
                    >
                      {skill.trim()}
                    </span>
                  ))}
                </div>
              </div>

              {/* Contact and Workload Info */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-400">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  <span className="font-mono">{tech.phone}</span>
                </div>
                <div className="flex items-center gap-1 text-slate-400">
                  <span className="text-slate-500">Active Jobs:</span>
                  <span className="font-bold text-white">{tech.active_jobs_count || 0}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
