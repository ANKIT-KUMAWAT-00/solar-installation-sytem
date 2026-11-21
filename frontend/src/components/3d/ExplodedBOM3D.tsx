"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Layers, RotateCcw, Box, CheckCircle2 } from "lucide-react";

interface ExplodedBOM3DProps {
  systemType?: string;
  capacityKw?: number;
}

export default function ExplodedBOM3D({
  systemType = "ON_GRID",
  capacityKw = 3.0,
}: ExplodedBOM3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [explosionFactor, setExplosionFactor] = useState(0.6); // 0 = compact, 1 = fully exploded
  const [activeLayer, setActiveLayer] = useState<string>("All Layers");

  const layersRef = useRef<{
    roof?: THREE.Mesh;
    stands?: THREE.Group;
    panels?: THREE.Group;
    wiring?: THREE.Group;
    inverter?: THREE.Group;
    batteries?: THREE.Group;
  }>({});

  useEffect(() => {
    if (!mountRef.current) return;
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight || 360;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(12, 10, 16);
    camera.lookAt(0, 3, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;

    mountRef.current.innerHTML = "";
    mountRef.current.appendChild(renderer.domElement);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dirLight = new THREE.DirectionalLight(0xffeedd, 1.5);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // --- Layer 1: Concrete Roof Deck ---
    const roofGeom = new THREE.BoxGeometry(10, 0.4, 7);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
    const roof = new THREE.Mesh(roofGeom, roofMat);
    roof.position.y = 0;
    scene.add(roof);
    layersRef.current.roof = roof;

    // --- Layer 2: Hot-Dip GI Elevated Stands ---
    const standsGroup = new THREE.Group();
    const standMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 });
    for (let i = -3; i <= 3; i += 3) {
      for (let j = -1.5; j <= 1.5; j += 3) {
        const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.2), standMat);
        stand.position.set(i, 0.6, j);
        standsGroup.add(stand);
        // Base plate
        const base = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.5), standMat);
        base.position.set(i, 0.05, j);
        standsGroup.add(base);
      }
    }
    // Racking rails
    const rail1 = new THREE.Mesh(new THREE.BoxGeometry(8, 0.08, 0.08), standMat);
    rail1.position.set(0, 1.2, -1.5);
    const rail2 = rail1.clone();
    rail2.position.set(0, 1.2, 1.5);
    standsGroup.add(rail1, rail2);
    scene.add(standsGroup);
    layersRef.current.stands = standsGroup;

    // --- Layer 3: Solar PV Panels ---
    const panelsGroup = new THREE.Group();
    const panelMat = new THREE.MeshStandardMaterial({
      color: 0x0f2b48,
      roughness: 0.15,
      metalness: 0.9,
    });
    const frameMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.9 });
    for (let c = -1; c <= 1; c++) {
      for (let r = 0; r < 2; r++) {
        const p = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.06, 1.3), panelMat);
        p.position.set(c * 2.5, 0, (r - 0.5) * 1.5);
        const f = new THREE.Mesh(new THREE.BoxGeometry(2.34, 0.08, 1.34), frameMat);
        f.position.set(c * 2.5, -0.01, (r - 0.5) * 1.5);
        panelsGroup.add(p, f);
      }
    }
    scene.add(panelsGroup);
    layersRef.current.panels = panelsGroup;

    // --- Layer 4: DC/AC Cables & Junction Boxes ---
    const wiringGroup = new THREE.Group();
    const boxMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.3 });
    const dcdb = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.0, 0.3), boxMat);
    dcdb.position.set(-3.5, 0, 0);
    const acdb = dcdb.clone();
    acdb.position.set(-2.4, 0, 0);
    wiringGroup.add(dcdb, acdb);

    // Glowing cables
    const cableMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 5), cableMat);
    cable.rotation.z = Math.PI / 2;
    cable.position.set(0, 0, 0);
    wiringGroup.add(cable);
    scene.add(wiringGroup);
    layersRef.current.wiring = wiringGroup;

    // --- Layer 5: Inverter Unit ---
    const inverterGroup = new THREE.Group();
    const invMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.2, metalness: 0.7 });
    const invBody = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.2, 0.5), invMat);
    // LCD screen
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.4), new THREE.MeshBasicMaterial({ color: 0x059669 }));
    screen.position.set(0, 0.4, 0.26);
    inverterGroup.add(invBody, screen);
    scene.add(inverterGroup);
    layersRef.current.inverter = inverterGroup;

    // Animation loop
    let animId: number;
    let rot = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      rot += 0.003;
      camera.position.x = 18 * Math.sin(rot);
      camera.position.z = 18 * Math.cos(rot);
      camera.lookAt(0, 2.5, 0);
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

  // Update vertical position of layers based on explosionFactor
  useEffect(() => {
    const factor = explosionFactor;
    if (layersRef.current.roof) layersRef.current.roof.position.y = 0;
    if (layersRef.current.stands) layersRef.current.stands.position.y = 0.5 + factor * 1.5;
    if (layersRef.current.panels) layersRef.current.panels.position.y = 1.6 + factor * 3.5;
    if (layersRef.current.wiring) layersRef.current.wiring.position.y = 2.4 + factor * 5.2;
    if (layersRef.current.inverter) layersRef.current.inverter.position.y = 3.2 + factor * 7.0;
  }, [explosionFactor]);

  return (
    <div className="relative w-full h-[380px] rounded-2xl overflow-hidden glass-panel border border-solar-border/80 shadow-solar-card flex flex-col">
      {/* Top Header */}
      <div className="absolute top-3 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-solar-gold/30 backdrop-blur-md">
          <Layers className="w-4 h-4 text-solar-gold" />
          <span className="text-xs font-semibold text-solar-gold uppercase tracking-wider">
            3D Exploded Bill of Materials (BOM) Architecture
          </span>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => setExplosionFactor(explosionFactor === 0 ? 0.7 : 0)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/90 border border-slate-700 hover:border-solar-gold text-slate-200 flex items-center gap-1.5 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5 text-solar-gold" />
            {explosionFactor === 0 ? "Explode 3D Stack" : "Compact"}
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Bottom Explode Slider & Architecture Legend */}
      <div className="absolute bottom-3 left-4 right-4 z-10 bg-slate-900/90 backdrop-blur-md border border-slate-800 p-3 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 pointer-events-auto shadow-2xl">
        <div className="w-full sm:w-1/2 flex items-center gap-3">
          <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Explode Stack</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={explosionFactor}
            onChange={(e) => setExplosionFactor(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-solar-gold"
          />
          <span className="text-xs font-bold text-solar-gold w-8">{Math.round(explosionFactor * 100)}%</span>
        </div>

        <div className="flex items-center gap-2 text-[11px] overflow-x-auto w-full sm:w-auto">
          <span className="px-2 py-1 rounded bg-blue-900/40 border border-blue-500/30 text-blue-300">Panels (6x)</span>
          <span className="px-2 py-1 rounded bg-sky-900/40 border border-sky-500/30 text-sky-300">Inverter (Growatt)</span>
          <span className="px-2 py-1 rounded bg-slate-800 border border-slate-600 text-slate-300">GI Stands</span>
          <span className="px-2 py-1 rounded bg-emerald-900/40 border border-emerald-500/30 text-emerald-300">Protection Box</span>
        </div>
      </div>
    </div>
  );
}
