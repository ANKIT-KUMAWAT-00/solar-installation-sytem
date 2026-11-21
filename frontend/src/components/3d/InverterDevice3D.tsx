"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Activity, ShieldCheck, AlertTriangle, Zap, Radio } from "lucide-react";

interface InverterDevice3DProps {
  initialStatus?: "NORMAL" | "WARNING" | "FAULT";
  modelName?: string;
  ratedKw?: number;
}

export default function InverterDevice3D({
  initialStatus = "NORMAL",
  modelName = "Growatt MIN 3000TL-X",
  ratedKw = 3.0,
}: InverterDevice3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [deviceStatus, setDeviceStatus] = useState<"NORMAL" | "WARNING" | "FAULT">(initialStatus);
  const [livePower, setLivePower] = useState(2.84);
  const [acVoltage, setAcVoltage] = useState(238.4);

  const statusLedRef = useRef<THREE.Mesh | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight || 280;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    mountRef.current.innerHTML = "";
    mountRef.current.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const pointLight = new THREE.PointLight(0x38bdf8, 2, 20);
    pointLight.position.set(4, 5, 5);
    scene.add(pointLight);

    // Inverter Body
    const inverterGroup = new THREE.Group();

    // Main Chassis
    const bodyGeom = new THREE.BoxGeometry(3.2, 4.4, 1.2);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.3,
      metalness: 0.7,
    });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    inverterGroup.add(body);

    // Aluminum Heat Sink Fins on sides
    const finMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.2 });
    for (let y = -1.8; y <= 1.8; y += 0.35) {
      const finL = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.08, 1.1), finMat);
      finL.position.set(-1.7, y, 0);
      const finR = finL.clone();
      finR.position.set(1.7, y, 0);
      inverterGroup.add(finL, finR);
    }

    // Front Bezel Panel
    const bezel = new THREE.Mesh(
      new THREE.BoxGeometry(2.8, 3.8, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 })
    );
    bezel.position.z = 0.62;
    inverterGroup.add(bezel);

    // Circular OLED Display Glass
    const oledGeom = new THREE.CylinderGeometry(0.7, 0.7, 0.05, 32);
    oledGeom.rotateX(Math.PI / 2);
    const oledMat = new THREE.MeshBasicMaterial({ color: 0x064e3b });
    const oled = new THREE.Mesh(oledGeom, oledMat);
    oled.position.set(0, 0.6, 0.68);
    inverterGroup.add(oled);

    // Glowing LED Ring
    const ledGeom = new THREE.TorusGeometry(0.75, 0.04, 16, 32);
    const ledMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    const ledRing = new THREE.Mesh(ledGeom, ledMat);
    ledRing.position.set(0, 0.6, 0.71);
    inverterGroup.add(ledRing);
    statusLedRef.current = ledRing;

    // Bottom Connection Port Knobs (DC Isolator Switch)
    const knobMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.3 });
    const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.3, 16), knobMat);
    knob.position.set(-0.8, -1.8, 0.6);
    knob.rotateX(Math.PI / 2);
    inverterGroup.add(knob);

    scene.add(inverterGroup);

    // Gentle floating animation
    let animId: number;
    let clock = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      clock += 0.02;
      inverterGroup.rotation.y = Math.sin(clock * 0.4) * 0.15;
      inverterGroup.rotation.x = Math.cos(clock * 0.3) * 0.05;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Update LED Color on status change
  useEffect(() => {
    if (!statusLedRef.current) return;
    const mat = statusLedRef.current.material as THREE.MeshBasicMaterial;
    if (deviceStatus === "NORMAL") {
      mat.color.setHex(0x10b981); // Emerald Green
    } else if (deviceStatus === "WARNING") {
      mat.color.setHex(0xf59e0b); // Amber Yellow
    } else {
      mat.color.setHex(0xef4444); // Critical Red
    }
  }, [deviceStatus]);

  return (
    <div className="relative w-full h-[280px] rounded-2xl overflow-hidden glass-panel border border-solar-border/80 shadow-solar-card flex flex-col justify-between p-3.5">
      <div className="flex items-center justify-between z-10">
        <div>
          <div className="text-xs font-semibold text-solar-emerald uppercase tracking-wider flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-solar-emerald animate-pulse" /> 3D Device Telemetry View
          </div>
          <div className="text-sm font-bold text-white">{modelName}</div>
        </div>

        {/* Live LED Status Selector */}
        <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setDeviceStatus("NORMAL")}
            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              deviceStatus === "NORMAL" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40" : "text-slate-400"
            }`}
          >
            Normal
          </button>
          <button
            onClick={() => setDeviceStatus("WARNING")}
            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              deviceStatus === "WARNING" ? "bg-amber-500/20 text-amber-400 border border-amber-500/40" : "text-slate-400"
            }`}
          >
            Warning
          </button>
          <button
            onClick={() => setDeviceStatus("FAULT")}
            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              deviceStatus === "FAULT" ? "bg-red-500/20 text-red-400 border border-red-500/40" : "text-slate-400"
            }`}
          >
            Fault
          </button>
        </div>
      </div>

      <div ref={mountRef} className="absolute inset-0 cursor-grab active:cursor-grabbing" />

      {/* Screen readout HUD */}
      <div className="z-10 bg-slate-900/90 backdrop-blur-md border border-slate-800 p-2.5 rounded-xl flex items-center justify-between">
        <div>
          <div className="text-[10px] text-slate-400">Current Generation</div>
          <div className="text-base font-bold text-solar-gold flex items-baseline gap-1">
            {deviceStatus === "FAULT" ? "0.00" : livePower} <span className="text-xs text-slate-400">kW</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-slate-400">AC Grid Voltage</div>
          <div className="text-sm font-bold text-white">
            {deviceStatus === "FAULT" ? "0.0 V" : `${acVoltage} V (50Hz)`}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-slate-400">Efficiency</div>
          <div className="text-sm font-bold text-solar-emerald">98.4% MPPT</div>
        </div>
      </div>
    </div>
  );
}
