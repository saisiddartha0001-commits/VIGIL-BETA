import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { SimulatedSatellite } from '../../types/simulation';
import { Play, Pause, RotateCcw, Layers } from 'lucide-react';

interface Orbital3DEnvironmentProps {
  satellites: SimulatedSatellite[];
  selectedSatId: string | null;
  onSelectSatellite: (satId: string) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  speed: number;
  onSetSpeed: (speed: number) => void;
  onResetClock: () => void;
  currentSimUtc: string;
}

// 1 unit = 1,000 km in Three.js coordinates
const SCALE_KM = 0.001;
const EARTH_RADIUS_3D = 6.378; // 6,378 km

export const Orbital3DEnvironment: React.FC<Orbital3DEnvironmentProps> = ({
  satellites,
  selectedSatId,
  onSelectSatellite,
  isPlaying,
  onTogglePlay,
  speed,
  onSetSpeed,
  onResetClock,
  currentSimUtc,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showOrbits, setShowOrbits] = useState(true);
  const [showDebris, setShowDebris] = useState(true);

  // Scene references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const earthRef = useRef<THREE.Mesh | null>(null);
  const orbitGroupRef = useRef<THREE.Group | null>(null);
  const markerGroupRef = useRef<THREE.Group | null>(null);
  const isDraggingRef = useRef(false);
  const previousMousePosRef = useRef({ x: 0, y: 0 });

  const selectedSat = useMemo(() => {
    return satellites.find(s => s.id === selectedSatId) || null;
  }, [satellites, selectedSatId]);

  // Initialize Three.js WebGL Scene
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x030408);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 18, 28);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 3. Renderer with antialiasing
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLight.position.set(20, 12, 18);
    scene.add(dirLight);

    const cyanGlowLight = new THREE.PointLight(0x00ffff, 0.4, 60);
    cyanGlowLight.position.set(-15, -8, -15);
    scene.add(cyanGlowLight);

    // 5. Starfield Background
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 2000;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 350;
      starPositions[i + 1] = (Math.random() - 0.5) * 350;
      starPositions[i + 2] = (Math.random() - 0.5) * 350;
    }
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMaterial = new THREE.PointsMaterial({ color: 0x8899aa, size: 0.8, transparent: true, opacity: 0.8 });
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // 6. Earth Sphere
    const earthGeo = new THREE.SphereGeometry(EARTH_RADIUS_3D, 48, 48);
    const earthMat = new THREE.MeshStandardMaterial({
      color: 0x091426,
      emissive: 0x030914,
      roughness: 0.65,
      metalness: 0.25,
    });
    const earth = new THREE.Mesh(earthGeo, earthMat);
    earthRef.current = earth;
    scene.add(earth);

    // Atmosphere Ring & Shell
    const atmoGeo = new THREE.SphereGeometry(EARTH_RADIUS_3D * 1.025, 48, 48);
    const atmoMat = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.1,
      side: THREE.BackSide,
    });
    const atmo = new THREE.Mesh(atmoGeo, atmoMat);
    scene.add(atmo);

    const ringGeo = new THREE.RingGeometry(EARTH_RADIUS_3D * 1.002, EARTH_RADIUS_3D * 1.004, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.35, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    scene.add(ring);

    // Groups for dynamic orbits & satellites
    const orbitGroup = new THREE.Group();
    orbitGroupRef.current = orbitGroup;
    scene.add(orbitGroup);

    const markerGroup = new THREE.Group();
    markerGroupRef.current = markerGroup;
    scene.add(markerGroup);

    // Animation Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (earthRef.current) {
        earthRef.current.rotation.y += 0.0008;
      }
      renderer.render(scene, camera);
    };
    animate();

    // Mouse Drag Controls
    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      previousMousePosRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !cameraRef.current) return;
      const dx = e.clientX - previousMousePosRef.current.x;
      const dy = e.clientY - previousMousePosRef.current.y;
      previousMousePosRef.current = { x: e.clientX, y: e.clientY };

      const cam = cameraRef.current;
      const radius = cam.position.length();
      let theta = Math.atan2(cam.position.x, cam.position.z);
      let phi = Math.acos(Math.max(-1, Math.min(1, cam.position.y / radius)));

      theta -= dx * 0.007;
      phi = Math.max(0.1, Math.min(Math.PI - 0.1, phi - dy * 0.007));

      cam.position.x = radius * Math.sin(phi) * Math.sin(theta);
      cam.position.y = radius * Math.cos(phi);
      cam.position.z = radius * Math.sin(phi) * Math.cos(theta);
      cam.lookAt(0, 0, 0);
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!cameraRef.current) return;
      const cam = cameraRef.current;
      const zoomFactor = e.deltaY * 0.02;
      const newLen = Math.max(9, Math.min(75, cam.position.length() + zoomFactor));
      cam.position.setLength(newLen);
    };

    // Click Selection via Raycasting
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleClick = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (!cameraRef.current || !markerGroupRef.current) return;
      raycaster.setFromCamera(mouse, cameraRef.current);
      const intersects = raycaster.intersectObjects(markerGroupRef.current.children);

      if (intersects.length > 0) {
        const targetId = intersects[0].object.userData?.satId;
        if (targetId) {
          onSelectSatellite(targetId);
        }
      }
    };

    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('click', handleClick);

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('click', handleClick);
      window.removeEventListener('resize', handleResize);
      if (rendererRef.current?.domElement) {
        container.removeChild(rendererRef.current.domElement);
      }
      renderer.dispose();
    };
  }, [onSelectSatellite]);

  // Update Orbits and Satellite Markers on simulation state update
  useEffect(() => {
    if (!orbitGroupRef.current || !markerGroupRef.current) return;
    const orbitGroup = orbitGroupRef.current;
    const markerGroup = markerGroupRef.current;

    // Clear old children
    while (orbitGroup.children.length > 0) {
      orbitGroup.remove(orbitGroup.children[0]);
    }
    while (markerGroup.children.length > 0) {
      markerGroup.remove(markerGroup.children[0]);
    }

    const filtered = satellites.filter(s => showDebris || s.type !== 'DEBRIS');

    // Rebuild Orbits
    if (showOrbits) {
      filtered.forEach(sat => {
        const pts = sat.orbitPath.map(p => new THREE.Vector3(p.x * SCALE_KM, p.z * SCALE_KM, -p.y * SCALE_KM));
        if (pts.length > 0) pts.push(pts[0].clone());

        const isSelected = sat.id === selectedSatId;
        const color = isSelected
          ? 0x00ffff
          : sat.status === 'CRITICAL_CONJUNCTION'
          ? 0xff00ff
          : sat.type === 'DEBRIS'
          ? 0xffa500
          : 0x29ab87;

        const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
        const lineMat = new THREE.LineBasicMaterial({
          color,
          transparent: true,
          opacity: isSelected ? 0.95 : 0.28,
        });
        const line = new THREE.Line(lineGeo, lineMat);
        orbitGroup.add(line);
      });
    }

    // Rebuild Markers
    filtered.forEach(sat => {
      const isSelected = sat.id === selectedSatId;
      const sphereGeo = new THREE.SphereGeometry(isSelected ? 0.35 : 0.22, 16, 16);
      const color = isSelected
        ? 0x00ffff
        : sat.status === 'CRITICAL_CONJUNCTION'
        ? 0xff00ff
        : sat.type === 'DEBRIS'
        ? 0xffa500
        : 0x29ab87;

      const sphereMat = new THREE.MeshBasicMaterial({ color });
      const marker = new THREE.Mesh(sphereGeo, sphereMat);
      marker.position.set(
        sat.positionKm.x * SCALE_KM,
        sat.positionKm.z * SCALE_KM,
        -sat.positionKm.y * SCALE_KM
      );
      marker.userData = { satId: sat.id };
      markerGroup.add(marker);

      // Selected halo ring
      if (isSelected) {
        const haloGeo = new THREE.RingGeometry(0.45, 0.55, 32);
        const haloMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, side: THREE.DoubleSide });
        const halo = new THREE.Mesh(haloGeo, haloMat);
        halo.position.copy(marker.position);
        markerGroup.add(halo);
      }
    });
  }, [satellites, selectedSatId, showOrbits, showDebris]);

  const handleResetCamera = () => {
    if (cameraRef.current) {
      cameraRef.current.position.set(0, 18, 28);
      cameraRef.current.lookAt(0, 0, 0);
    }
  };

  return (
    <div className="relative w-full h-[580px] bg-[#030408] rounded-xl border border-[rgba(0,255,255,0.25)] overflow-hidden shadow-[0_0_30px_rgba(0,255,255,0.1)] flex flex-col font-mono select-none">
      {/* Top Header HUD overlay */}
      <div className="absolute top-0 left-0 right-0 z-10 px-4 py-2.5 bg-gradient-to-b from-[#090d1f]/90 to-transparent flex items-center justify-between border-b border-[rgba(0,255,255,0.15)] backdrop-blur-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00FFFF] animate-ping" />
            <span className="text-xs font-bold text-[#00FFFF] uppercase tracking-wider font-display">
              3D ORBITAL SIMULATION ENVIRONMENT
            </span>
          </div>
          <span className="text-[10px] text-[#8b80b6] px-2 py-0.5 rounded bg-[#111530] border border-[rgba(0,255,255,0.2)]">
            DETERMINISTIC 2-BODY ENGINE
          </span>
        </div>

        {/* Legend */}
        <div className="hidden sm:flex items-center gap-3 text-[10px]">
          <span className="flex items-center gap-1.5 text-[#29AB87]">
            <span className="w-2 h-2 rounded-full bg-[#29AB87]" /> NOMINAL
          </span>
          <span className="flex items-center gap-1.5 text-[#FFA500]">
            <span className="w-2 h-2 rounded-full bg-[#FFA500]" /> DEBRIS
          </span>
          <span className="flex items-center gap-1.5 text-[#FF00FF]">
            <span className="w-2 h-2 rounded-full bg-[#FF00FF] animate-pulse" /> CRITICAL CONJUNCTION
          </span>
        </div>
      </div>

      {/* 3D WebGL Canvas Container */}
      <div ref={containerRef} className="flex-1 w-full h-full relative cursor-grab active:cursor-grabbing" />

      {/* Selected Satellite Mini HUD Overlay */}
      {selectedSat && (
        <div className="absolute top-14 left-4 z-10 w-72 p-3 bg-[#090d1f]/95 border border-[#00FFFF]/40 rounded-lg shadow-[0_0_20px_rgba(0,255,255,0.2)] text-xs backdrop-blur-md">
          <div className="flex items-center justify-between pb-1.5 border-b border-[rgba(0,255,255,0.2)] mb-2">
            <span className="font-bold text-[#00FFFF] truncate">{selectedSat.name}</span>
            <span className="text-[10px] text-[#8b80b6] px-1.5 py-0.5 rounded bg-[#111530]">
              {selectedSat.id}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-y-1.5 text-[11px] text-[#edf4ff]">
            <div><span className="text-[#8b80b6]">Regime:</span> {selectedSat.regime}</div>
            <div><span className="text-[#8b80b6]">Type:</span> {selectedSat.type}</div>
            <div><span className="text-[#8b80b6]">Altitude:</span> {Math.round(selectedSat.altitudeKm)} km</div>
            <div><span className="text-[#8b80b6]">Speed:</span> {selectedSat.speedKmS.toFixed(2)} km/s</div>
            <div><span className="text-[#8b80b6]">Period:</span> {selectedSat.periodMinutes.toFixed(1)} m</div>
            <div><span className="text-[#8b80b6]">Status:</span> {selectedSat.status}</div>
          </div>

          {selectedSat.conjunctionPartnerId && (
            <div className="mt-2 pt-1.5 border-t border-[rgba(255,0,255,0.3)] text-[10px] text-[#FF00FF]">
              ⚠ Impending Conjunction with {selectedSat.conjunctionPartnerId}
              {selectedSat.minMissDistanceM !== undefined && (
                <div>Miss Distance: {selectedSat.minMissDistanceM} m</div>
              )}
              {selectedSat.pocValue !== undefined && (
                <div>Collision Prob: {selectedSat.pocValue.toExponential(3)}</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Bottom Simulation Control Bar */}
      <div className="px-4 py-2.5 bg-[#090d1f]/95 border-t border-[rgba(0,255,255,0.2)] flex flex-wrap items-center justify-between gap-3 z-10 text-xs">
        {/* Play/Pause & Clock Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onTogglePlay}
            className={`p-2 rounded border transition-colors flex items-center gap-1.5 font-bold ${
              isPlaying
                ? 'bg-[#FF4500]/20 border-[#FF4500] text-[#FF4500]'
                : 'bg-[#00FFFF]/20 border-[#00FFFF] text-[#00FFFF]'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'PAUSE' : 'PLAY'}</span>
          </button>

          <button
            onClick={onResetClock}
            className="p-2 rounded bg-[#111530] border border-[rgba(0,255,255,0.3)] text-[#8b80b6] hover:text-[#00FFFF] transition-colors"
            title="Reset Simulation Time"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Speed Multipliers */}
          <div className="flex items-center bg-[#111530] border border-[rgba(0,255,255,0.25)] rounded overflow-hidden">
            {[1, 5, 30, 60].map(s => (
              <button
                key={s}
                onClick={() => onSetSpeed(s)}
                className={`px-2.5 py-1 text-[11px] transition-colors ${
                  speed === s
                    ? 'bg-[#00FFFF] text-[#050914] font-bold'
                    : 'text-[#8b80b6] hover:text-[#00FFFF]'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Current Simulation Timestamp */}
        <div className="flex items-center gap-2 text-[#00FFFF] font-mono text-[11px]">
          <span className="text-[#8b80b6]">SIM TIME:</span>
          <span className="px-2 py-0.5 rounded bg-[#111530] border border-[rgba(0,255,255,0.2)] font-semibold">
            {currentSimUtc.replace('T', ' ').substring(0, 19)} UTC
          </span>
        </div>

        {/* View Toggles & Camera Reset */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowOrbits(!showOrbits)}
            className={`px-2 py-1 rounded border text-[11px] flex items-center gap-1 transition-colors ${
              showOrbits
                ? 'bg-[#00FFFF]/20 border-[#00FFFF] text-[#00FFFF]'
                : 'bg-[#111530] border-[rgba(0,255,255,0.2)] text-[#8b80b6]'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>ORBITS</span>
          </button>

          <button
            onClick={() => setShowDebris(!showDebris)}
            className={`px-2 py-1 rounded border text-[11px] flex items-center gap-1 transition-colors ${
              showDebris
                ? 'bg-[#FFA500]/20 border-[#FFA500] text-[#FFA500]'
                : 'bg-[#111530] border-[rgba(0,255,255,0.2)] text-[#8b80b6]'
            }`}
          >
            <span>DEBRIS</span>
          </button>

          <button
            onClick={handleResetCamera}
            className="px-2 py-1 rounded bg-[#111530] border border-[rgba(0,255,255,0.3)] text-[#8b80b6] hover:text-[#00FFFF] text-[11px] transition-colors"
          >
            RESET CAM
          </button>
        </div>
      </div>
    </div>
  );
};
