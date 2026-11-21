"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Sun, RotateCw, Compass, Eye, Zap } from "lucide-react";

interface RooftopSolar3DProps {
  initialTilt?: number;
  initialCapacityKw?: number;
}

export default function RooftopSolar3D({
  initialTilt = 15,
  initialCapacityKw = 3.0,
}: RooftopSolar3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState(initialTilt);
  const [azimuth, setAzimuth] = useState(180); // South
  const [sunHour, setSunHour] = useState(12.5); // Solar Noon
  const [irradiance, setIrradiance] = useState(940);
  const [currentPowerKw, setCurrentPowerKw] = useState(initialCapacityKw * 0.94);
  const [isRotating, setIsRotating] = useState(false);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const roofPanelsGroupRef = useRef<THREE.Group | null>(null);
  const sunLightRef = useRef<THREE.DirectionalLight | null>(null);
  const sunSphereRef = useRef<THREE.Mesh | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight || 360;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(14, 12, 18);
    camera.lookAt(0, 2, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    mountRef.current.innerHTML = "";
    mountRef.current.appendChild(renderer.domElement);

    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    // Sun Light
    const sunLight = new THREE.DirectionalLight(0xfff3cc, 1.8);
    sunLight.position.set(0, 20, 10);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.bias = -0.001;
    scene.add(sunLight);
    sunLightRef.current = sunLight;

    // Glowing Sun Sphere
    const sunGeom = new THREE.SphereGeometry(0.8, 16, 16);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const sunSphere = new THREE.Mesh(sunGeom, sunMat);
    scene.add(sunSphere);
    sunSphereRef.current = sunSphere;

    // Base Building / Roof Deck
    const buildingGroup = new THREE.Group();

    // Ground platform
    const groundGeom = new THREE.CylinderGeometry(12, 12, 0.4, 32);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.8,
      metalness: 0.2,
    });
    const ground = new THREE.Mesh(groundGeom, groundMat);
    ground.position.y = -0.2;
    ground.receiveShadow = true;
    buildingGroup.add(ground);

    // House walls
    const houseGeom = new THREE.BoxGeometry(8, 4, 8);
    const houseMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.7,
    });
    const house = new THREE.Mesh(houseGeom, houseMat);
    house.position.y = 2;
    house.castShadow = true;
    house.receiveShadow = true;
    buildingGroup.add(house);

    // Concrete flat roof slab
    const slabGeom = new THREE.BoxGeometry(8.8, 0.4, 8.8);
    const slabMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.9,
    });
    const slab = new THREE.Mesh(slabGeom, slabMat);
    slab.position.y = 4.2;
    slab.castShadow = true;
    slab.receiveShadow = true;
    buildingGroup.add(slab);

    // Parapet borders
    const parapetMat = new THREE.MeshStandardMaterial({ color: 0x475569 });
    const p1 = new THREE.Mesh(new THREE.BoxGeometry(8.8, 0.4, 0.2), parapetMat);
    p1.position.set(0, 4.5, 4.3);
    const p2 = p1.clone();
    p2.position.set(0, 4.5, -4.3);
    const p3 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.4, 8.8), parapetMat);
    p3.position.set(4.3, 4.5, 0);
    const p4 = p3.clone();
    p4.position.set(-4.3, 4.5, 0);
    buildingGroup.add(p1, p2, p3, p4);

    // Roof Solar Panels Array Group
    const panelsGroup = new THREE.Group();
    panelsGroup.position.set(0, 4.5, 0);

    // Create 6 solar modules with elevated GI stands (2 rows x 3 columns)
    const panelGeom = new THREE.BoxGeometry(2.0, 0.05, 1.2);
    
    // Photovoltaic cell texture material (dark navy blue with antireflective sheen)
    const panelMat = new THREE.MeshStandardMaterial({
      color: 0x0a192f,
      roughness: 0.15,
      metalness: 0.85,
    });

    const frameMat = new THREE.MeshStandardMaterial({
      color: 0xc0c8d0,
      metalness: 0.9,
      roughness: 0.2,
    });

    const standMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.7,
      roughness: 0.4,
    });

    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 3; c++) {
        const pGroup = new THREE.Group();
        const posX = (c - 1) * 2.3;
        const posZ = (r - 0.5) * 1.6;
        pGroup.position.set(posX, 0.3, posZ);

        // Stand legs
        const legGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.4);
        const leg1 = new THREE.Mesh(legGeom, standMat);
        leg1.position.set(-0.8, -0.15, -0.4);
        const leg2 = leg1.clone();
        leg2.position.set(0.8, -0.15, -0.4);
        const leg3 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.7), standMat);
        leg3.position.set(-0.8, 0.0, 0.4);
        const leg4 = leg3.clone();
        leg4.position.set(0.8, 0.0, 0.4);
        pGroup.add(leg1, leg2, leg3, leg4);

        // Panel frame
        const frame = new THREE.Mesh(new THREE.BoxGeometry(2.04, 0.06, 1.24), frameMat);
        frame.castShadow = true;
        frame.receiveShadow = true;

        // PV Blue Cell
        const cell = new THREE.Mesh(panelGeom, panelMat);
        cell.position.y = 0.02;
        cell.castShadow = true;
        cell.receiveShadow = true;

        // Silver Busbar Lines
        const busbarMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8 });
        const line1 = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 1.18), busbarMat);
        line1.position.set(-0.4, 0.05, 0);
        const line2 = line1.clone();
        line2.position.set(0.4, 0.05, 0);
        cell.add(line1, line2);

        pGroup.add(frame);
        pGroup.add(cell);
        panelsGroup.add(pGroup);
      }
    }

    buildingGroup.add(panelsGroup);
    roofPanelsGroupRef.current = panelsGroup;
    scene.add(buildingGroup);

    // Animation loop
    let animId: number;
    let angle = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (isRotating) {
        angle += 0.005;
        camera.position.x = 22 * Math.sin(angle);
        camera.position.z = 22 * Math.cos(angle);
        camera.lookAt(0, 3, 0);
      }
      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight || 360;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animId);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Update Tilt & Azimuth
  useEffect(() => {
    if (!roofPanelsGroupRef.current) return;
    const tiltRad = THREE.MathUtils.degToRad(tilt);
    const azRad = THREE.MathUtils.degToRad(azimuth - 180);
    roofPanelsGroupRef.current.rotation.x = -tiltRad;
    roofPanelsGroupRef.current.rotation.y = azRad;
  }, [tilt, azimuth]);

  // Update Sun Trajectory & Real-Time Solar Calculations
  useEffect(() => {
    if (!sunLightRef.current || !sunSphereRef.current) return;
    // Sun trajectory angle from 6:00 to 18:00
    const progress = (sunHour - 6) / 12; // 0 to 1
    const sunElevation = Math.max(0, Math.sin(progress * Math.PI));
    const sunAzimuth = (progress - 0.5) * Math.PI; // East to West

    const radius = 22;
    const posX = radius * Math.sin(sunAzimuth);
    const posY = Math.max(0.5, radius * sunElevation);
    const posZ = radius * Math.cos(sunAzimuth) * 0.7;

    sunLightRef.current.position.set(posX, posY, posZ);
    sunSphereRef.current.position.set(posX, posY, posZ);

    // Calculate dynamic irradiance & projected output
    const calculatedIrr = Math.round(sunElevation * 980);
    setIrradiance(calculatedIrr);
    const tiltEfficiency = Math.cos(THREE.MathUtils.degToRad(Math.abs(tilt - 20))) * 0.98;
    const genKw = Math.max(0, Number(((initialCapacityKw * (calculatedIrr / 1000) * tiltEfficiency)).toFixed(2)));
    setCurrentPowerKw(genKw);
  }, [sunHour, tilt, initialCapacityKw]);

  return (
    <div className="relative w-full h-[380px] rounded-2xl overflow-hidden glass-panel border border-solar-border/80 shadow-solar-card flex flex-col">
      {/* Top 3D Badge & Status Overlay */}
      <div className="absolute top-3 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-emerald-500/30 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">
            Interactive 3D PV Rooftop Simulator
          </span>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => setIsRotating(!isRotating)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-all ${
              isRotating
                ? "bg-amber-500/20 border-amber-500 text-amber-300 shadow-solar-gold"
                : "bg-slate-800/80 border-slate-700 text-slate-300 hover:border-slate-500"
            }`}
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRotating ? "animate-spin" : ""}`} />
            {isRotating ? "Orbiting" : "360° Orbit"}
          </button>
        </div>
      </div>

      {/* Three.js Canvas Container */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating 3D Telemetry HUD */}
      <div className="absolute bottom-3 left-4 right-4 z-10 grid grid-cols-2 sm:grid-cols-4 gap-2.5 pointer-events-auto">
        <div className="bg-slate-900/85 backdrop-blur-md border border-slate-800 p-2.5 rounded-xl shadow-lg">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-0.5">
            <Zap className="w-3.5 h-3.5 text-solar-gold" /> Projected Output
          </div>
          <div className="text-lg font-bold text-white flex items-baseline gap-1">
            {currentPowerKw} <span className="text-xs text-solar-emerald font-semibold">kW</span>
          </div>
        </div>

        <div className="bg-slate-900/85 backdrop-blur-md border border-slate-800 p-2.5 rounded-xl shadow-lg">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-0.5">
            <Sun className="w-3.5 h-3.5 text-amber-400" /> Solar Irradiance
          </div>
          <div className="text-lg font-bold text-white flex items-baseline gap-1">
            {irradiance} <span className="text-xs text-slate-400">W/m²</span>
          </div>
        </div>

        <div className="bg-slate-900/85 backdrop-blur-md border border-slate-800 p-2.5 rounded-xl shadow-lg">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <span className="flex items-center gap-1"><Compass className="w-3.5 h-3.5 text-cyan-400" /> Roof Tilt</span>
            <span className="font-bold text-white">{tilt}°</span>
          </div>
          <input
            type="range"
            min="0"
            max="45"
            value={tilt}
            onChange={(e) => setTilt(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-solar-emerald"
          />
        </div>

        <div className="bg-slate-900/85 backdrop-blur-md border border-slate-800 p-2.5 rounded-xl shadow-lg">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <span className="flex items-center gap-1"><Sun className="w-3.5 h-3.5 text-amber-400" /> Sun Position</span>
            <span className="font-bold text-white">{Math.floor(sunHour)}:{Math.round((sunHour % 1) * 60).toString().padStart(2, '0')}</span>
          </div>
          <input
            type="range"
            min="6"
            max="18"
            step="0.25"
            value={sunHour}
            onChange={(e) => setSunHour(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-solar-gold"
          />
        </div>
      </div>
    </div>
  );
}
