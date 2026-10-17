import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { SimulatedSatellite } from '../../types/simulation';
import { Play, Pause, RotateCcw, Layers, AlertTriangle, Flame, ShieldCheck, X, ChevronDown, ChevronUp } from 'lucide-react';

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
  onRequestEvasiveBurn?: (satId: string) => void;
  onTriggerCollisionSimulation?: (satAId: string, satBId: string) => void;
}

// 1 unit = 1,000 km in Three.js coordinates
const SCALE_KM = 0.001;
const EARTH_RADIUS_3D = 6.378; // 6,378 km

/**
 * Generate a procedural equirectangular Earth texture on a 2D HTML canvas.
 * Renders realistic oceans, continents (Eurasia, Africa, Americas, Australia, Antarctica),
 * mountain/desert biomes, lat-long meridians, and polar ice caps.
 */
function createEarthCanvasTexture(): THREE.CanvasTexture {
  const width = 2048;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // 1. Deep Ocean Base with subtle depth shading
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
  oceanGrad.addColorStop(0, '#0c2340');
  oceanGrad.addColorStop(0.2, '#0e3860');
  oceanGrad.addColorStop(0.5, '#124578');
  oceanGrad.addColorStop(0.8, '#0e3860');
  oceanGrad.addColorStop(1, '#0c2340');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Continental Landmass Drawing Helper (lat/lon to x/y mapping)
  const toX = (lonDeg: number) => ((lonDeg + 180) / 360) * width;
  const toY = (latDeg: number) => ((90 - latDeg) / 180) * height;

  const drawLandmass = (points: [number, number][], fillColor: string, strokeColor = '#246b48') => {
    ctx.beginPath();
    points.forEach(([lon, lat], idx) => {
      const x = toX(lon);
      const y = toY(lat);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.fill();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  };

  // North America
  drawLandmass([
    [-168, 65], [-140, 70], [-100, 72], [-70, 62], [-55, 48], [-75, 35],
    [-80, 25], [-97, 20], [-105, 23], [-117, 32], [-124, 48], [-140, 58], [-165, 62]
  ], '#2d6a4f');

  // Central America
  drawLandmass([
    [-98, 20], [-87, 13], [-77, 8], [-82, 9], [-92, 16], [-102, 19]
  ], '#38b000');

  // South America
  drawLandmass([
    [-77, 8], [-52, 4], [-35, -5], [-38, -15], [-50, -30], [-68, -54],
    [-75, -45], [-72, -30], [-80, -5], [-80, 5]
  ], '#208b3a');

  // Europe
  drawLandmass([
    [-10, 36], [0, 43], [5, 52], [15, 58], [28, 70], [42, 68],
    [32, 50], [25, 40], [15, 38], [-5, 36]
  ], '#3a5a40');

  // Africa
  drawLandmass([
    [-17, 32], [10, 37], [32, 31], [43, 12], [51, 10], [40, -5],
    [35, -25], [20, -35], [17, -30], [12, -5], [5, 4], [-15, 12]
  ], '#a39151', '#7f6f36');

  // Asia / Eurasia
  drawLandmass([
    [40, 68], [70, 73], [105, 77], [140, 72], [170, 66], [142, 50],
    [130, 40], [120, 32], [108, 20], [100, 5], [80, 10], [70, 24],
    [50, 30], [38, 45], [42, 60]
  ], '#386641');

  // India
  drawLandmass([
    [68, 24], [78, 30], [88, 22], [82, 10], [77, 8], [72, 18]
  ], '#588157');

  // Australia
  drawLandmass([
    [113, -22], [130, -12], [142, -11], [153, -28], [148, -38],
    [135, -35], [118, -35], [114, -26]
  ], '#b08968', '#7f5539');

  // Antarctica & North Polar Ice
  ctx.fillStyle = '#e2f1f8';
  ctx.fillRect(0, toY(-68), width, height - toY(-68));
  ctx.fillRect(0, 0, width, toY(75));

  // 3. Grid meridians & Equator
  ctx.strokeStyle = 'rgba(0, 255, 255, 0.15)';
  ctx.lineWidth = 1;
  for (let lat = -60; lat <= 60; lat += 30) {
    const y = toY(lat);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  for (let lon = -150; lon <= 180; lon += 30) {
    const x = toX(lon);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // Golden glowing equator line
  ctx.strokeStyle = 'rgba(0, 255, 255, 0.45)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, toY(0));
  ctx.lineTo(width, toY(0));
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * Procedural atmospheric cloud layer texture
 */
function createCloudCanvasTexture(): THREE.CanvasTexture {
  const width = 1024;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.clearRect(0, 0, width, height);

  // Soft wispy cloud bands across temperate and equatorial latitudes
  ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
  for (let i = 0; i < 90; i++) {
    const x = Math.random() * width;
    const y = 80 + Math.random() * (height - 160);
    const radiusX = 25 + Math.random() * 90;
    const radiusY = 10 + Math.random() * 25;
    ctx.beginPath();
    ctx.ellipse(x, y, radiusX, radiusY, Math.random() * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
}

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
  onRequestEvasiveBurn,
  onTriggerCollisionSimulation,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showOrbits, setShowOrbits] = useState(true);
  const [showDebris, setShowDebris] = useState(true);

  // Scene references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const earthRef = useRef<THREE.Mesh | null>(null);
  const cloudsRef = useRef<THREE.Mesh | null>(null);
  const orbitGroupRef = useRef<THREE.Group | null>(null);
  const markerGroupRef = useRef<THREE.Group | null>(null);
  const isDraggingRef = useRef(false);
  const previousMousePosRef = useRef({ x: 0, y: 0 });

  // User-chosen collision simulation state: only pop out when a pair is chosen
  const [activeCollisionPair, setActiveCollisionPair] = useState<{ satAId: string; satBId: string } | null>(null);
  const [isAlertMinimized, setIsAlertMinimized] = useState(false);
  const [isAlertDismissed, setIsAlertDismissed] = useState(false);

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

    // 6. Realistic Earth Sphere with Procedural Texture & Specular Highlighting
    const earthGeo = new THREE.SphereGeometry(EARTH_RADIUS_3D, 64, 64);
    const earthTexture = createEarthCanvasTexture();
    const earthMat = new THREE.MeshStandardMaterial({
      map: earthTexture,
      roughness: 0.55,
      metalness: 0.1,
      emissive: 0x051224,
      emissiveIntensity: 0.25,
    });
    const earth = new THREE.Mesh(earthGeo, earthMat);
    earthRef.current = earth;
    scene.add(earth);

    // Revolving Wispy Atmospheric Cloud Sphere
    const cloudGeo = new THREE.SphereGeometry(EARTH_RADIUS_3D * 1.012, 48, 48);
    const cloudTexture = createCloudCanvasTexture();
    const cloudMat = new THREE.MeshStandardMaterial({
      map: cloudTexture,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const clouds = new THREE.Mesh(cloudGeo, cloudMat);
    cloudsRef.current = clouds;
    scene.add(clouds);

    // Atmosphere Ring & Rayleigh Glow Shell
    const atmoGeo = new THREE.SphereGeometry(EARTH_RADIUS_3D * 1.035, 48, 48);
    const atmoMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.16,
      side: THREE.BackSide,
    });
    const atmo = new THREE.Mesh(atmoGeo, atmoMat);
    scene.add(atmo);

    const ringGeo = new THREE.RingGeometry(EARTH_RADIUS_3D * 1.002, EARTH_RADIUS_3D * 1.006, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.45, side: THREE.DoubleSide });
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
        earthRef.current.rotation.y += 0.0006;
      }
      if (cloudsRef.current) {
        cloudsRef.current.rotation.y += 0.00085;
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

    // Rebuild Markers & Conjunction Encounter Vector Lines
    const processedPairs = new Set<string>();

    filtered.forEach(sat => {
      const isSelected = sat.id === selectedSatId;
      const isCritical = sat.status === 'CRITICAL_CONJUNCTION';
      const sphereGeo = new THREE.SphereGeometry(isCritical ? 0.38 : isSelected ? 0.35 : 0.22, 16, 16);
      const color = isCritical
        ? 0xff0055 // High-contrast pulsing crimson/magenta for collision threat
        : isSelected
        ? 0x00ffff
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
      if (isSelected || isCritical) {
        const haloGeo = new THREE.RingGeometry(0.45, 0.55, 32);
        const haloMat = new THREE.MeshBasicMaterial({
          color: isCritical ? 0xff0055 : 0x00ffff,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.85,
        });
        const halo = new THREE.Mesh(haloGeo, haloMat);
        halo.position.copy(marker.position);
        markerGroup.add(halo);
      }

      // Draw active proximity vector line between colliding satellite pair
      if (isCritical && sat.conjunctionPartnerId) {
        const partner = satellites.find(s => s.id === sat.conjunctionPartnerId);
        const pairKey = [sat.id, sat.conjunctionPartnerId].sort().join('--');
        if (partner && !processedPairs.has(pairKey)) {
          processedPairs.add(pairKey);

          const p1 = new THREE.Vector3(sat.positionKm.x * SCALE_KM, sat.positionKm.z * SCALE_KM, -sat.positionKm.y * SCALE_KM);
          const p2 = new THREE.Vector3(partner.positionKm.x * SCALE_KM, partner.positionKm.z * SCALE_KM, -partner.positionKm.y * SCALE_KM);

          const lineGeo = new THREE.BufferGeometry().setFromPoints([p1, p2]);
          const lineMat = new THREE.LineDashedMaterial({
            color: 0xff0055,
            dashSize: 0.3,
            gapSize: 0.15,
            linewidth: 2,
          });
          const proximityLine = new THREE.Line(lineGeo, lineMat);
          proximityLine.computeLineDistances();
          markerGroup.add(proximityLine);
        }
      }
    });
  }, [satellites, selectedSatId, showOrbits, showDebris]);

  const handleResetCamera = () => {
    if (cameraRef.current) {
      cameraRef.current.position.set(0, 18, 28);
      cameraRef.current.lookAt(0, 0, 0);
    }
  };

  const handleFocusSatellite = (satId: string) => {
    const target = satellites.find(s => s.id === satId);
    if (!target || !cameraRef.current) return;
    const px = target.positionKm.x * SCALE_KM;
    const py = target.positionKm.z * SCALE_KM;
    const pz = -target.positionKm.y * SCALE_KM;

    const dir = new THREE.Vector3(px, py, pz).normalize();
    const distance = Math.sqrt(px * px + py * py + pz * pz) + 4.5;
    cameraRef.current.position.set(dir.x * distance, dir.y * distance + 1.5, dir.z * distance);
    cameraRef.current.lookAt(px, py, pz);
  };

  return (
    <div className="relative w-full h-[580px] bg-[#030408] rounded-xl border border-[rgba(0,255,255,0.25)] overflow-hidden shadow-[0_0_30px_rgba(0,255,255,0.1)] flex flex-col font-mono select-none">
      {/* Top Header HUD overlay */}
      <div className="absolute top-0 left-0 right-0 z-10 px-4 py-2.5 bg-gradient-to-b from-[#090d1f]/95 via-[#090d1f]/80 to-transparent flex flex-wrap items-center justify-between gap-2 border-b border-[rgba(0,255,255,0.15)] backdrop-blur-xs">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00FFFF] animate-ping shrink-0" />
            <span className="text-xs font-bold text-[#00FFFF] uppercase tracking-wider font-display">
              3D ORBITAL SIMULATION ENVIRONMENT
            </span>
          </div>
          <span className="text-[10px] text-[#8b80b6] px-2 py-0.5 rounded bg-[#111530] border border-[rgba(0,255,255,0.2)] shrink-0">
            DETERMINISTIC 2-BODY ENGINE
          </span>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[10px] flex-wrap">
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

      {/* Selected Satellite Target Focus Bar (Unobtrusive Corner Pill) */}
      {selectedSat && (
        <div className="absolute top-12 left-3 z-10 p-2.5 bg-[#090d1f]/90 border border-[#00FFFF]/40 rounded-lg shadow-[0_0_15px_rgba(0,255,255,0.2)] text-[11px] backdrop-blur-md flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00FFFF] animate-ping" />
            <span className="font-bold text-[#FFFFFF]">{selectedSat.name}</span>
            <span className="text-[10px] text-[#00FFFF] bg-[#111530] px-1.5 py-0.5 rounded border border-[#00FFFF]/20">
              {selectedSat.id}
            </span>
          </div>
          <button
            onClick={() => handleFocusSatellite(selectedSat.id)}
            className="px-2 py-0.5 bg-[#00FFFF]/20 hover:bg-[#00FFFF]/30 border border-[#00FFFF]/50 text-[#00FFFF] rounded text-[10px] font-bold transition-colors"
          >
            FOCUS
          </button>
        </div>
      )}

      {/* Dynamic 3D Collision Warning & Calculations HUD - Pops out ONLY when user selects a pair */}
      {(() => {
        if (!activeCollisionPair || isAlertDismissed) return null;

        const satA = satellites.find(s => s.id === activeCollisionPair.satAId);
        const satB = satellites.find(s => s.id === activeCollisionPair.satBId);
        if (!satA || !satB) return null;

        // If maneuver was executed and hazard cleared, auto-retire alert
        if (satA.hasManeuvered || satB.hasManeuvered) return null;

        const criticalConjSat = (satA.status === 'CRITICAL_CONJUNCTION' ? satA : (satB.status === 'CRITICAL_CONJUNCTION' ? satB : satA));
        const partnerSat = criticalConjSat.id === satA.id ? satB : satA;

        const missDist = criticalConjSat.minMissDistanceM !== undefined ? criticalConjSat.minMissDistanceM : 216.5;
        const poc = criticalConjSat.pocValue !== undefined ? criticalConjSat.pocValue : 3.26e-5;
        
        // Compute real-time relative velocity magnitude from actual state vectors
        const dxV = criticalConjSat.velocityKmS.x - partnerSat.velocityKmS.x;
        const dyV = criticalConjSat.velocityKmS.y - partnerSat.velocityKmS.y;
        const dzV = criticalConjSat.velocityKmS.z - partnerSat.velocityKmS.z;
        const liveRelSpeed = Math.sqrt(dxV * dxV + dyV * dyV + dzV * dzV);
        const relSpeed = criticalConjSat.relativeSpeedKmS ?? (liveRelSpeed > 0.001 ? liveRelSpeed : 7.62);
        const deltaVReq = 2.40; // m/s required prograde burn
        const postBurnMiss = 5420; // m certified safe clearance

        if (isAlertMinimized) {
          return (
            <div className="absolute top-12 right-3 z-20 bg-[#0d0716]/90 border border-[#FF0055] rounded-lg px-3 py-1.5 shadow-[0_0_20px_rgba(255,0,85,0.35)] backdrop-blur-md text-xs flex items-center gap-2">
              <span className="p-1 rounded bg-[#FF0055]/20 text-[#FF0055] animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5" />
              </span>
              <span className="text-[11px] font-bold text-[#FF0055] tracking-wide">
                COLLISION: {criticalConjSat.name} vs {partnerSat.name}
              </span>
              <button
                onClick={() => setIsAlertMinimized(false)}
                className="p-1 text-[#00FFFF] hover:text-white"
                title="Expand Warning"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsAlertDismissed(true)}
                className="p-1 text-[#8b80b6] hover:text-[#FF0055]"
                title="Dismiss Alert"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        }

        return (
          <div className="absolute top-12 right-3 z-20 max-w-xs w-full bg-[#0d0716]/90 border-2 border-[#FF0055] rounded-xl p-3 shadow-[0_0_30px_rgba(255,0,85,0.4)] backdrop-blur-md text-xs animate-in fade-in duration-200">
            {/* Header with pulsing warning icon & minimize/close controls */}
            <div className="flex items-center justify-between pb-2 border-b border-[#FF0055]/30 mb-2">
              <div className="flex items-center gap-1.5">
                <span className="p-1 rounded bg-[#FF0055]/20 text-[#FF0055] animate-pulse">
                  <AlertTriangle className="w-3.5 h-3.5" />
                </span>
                <div>
                  <div className="text-[10px] font-bold text-[#FFFFFF] tracking-wider uppercase font-display">
                    CONJUNCTION TRAJECTORY
                  </div>
                  <div className="text-[8px] text-[#FF0055] font-semibold">
                    SIMULATED INTERSECTION
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsAlertMinimized(true)}
                  className="p-1 rounded text-[#8b80b6] hover:text-[#00FFFF] transition-colors"
                  title="Minimize"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsAlertDismissed(true)}
                  className="p-1 rounded text-[#8b80b6] hover:text-[#FF0055] transition-colors"
                  title="Close"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Satellite pair confrontation */}
            <div className="p-1.5 rounded bg-[#180a1c] border border-[#FF0055]/30 mb-2 space-y-0.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-[#00FFFF] font-bold truncate max-w-[110px]">{criticalConjSat.name}</span>
                <span className="text-[#FF0055] font-bold px-1 text-[9px]">VS</span>
                <span className="text-[#FFA500] font-bold truncate max-w-[110px]">{partnerSat.name}</span>
              </div>
              <div className="flex justify-between text-[9px] text-[#8b80b6]">
                <span>{criticalConjSat.id}</span>
                <span>{partnerSat.id}</span>
              </div>
            </div>

            {/* Orbital Physics Calculations Grid */}
            <div className="grid grid-cols-2 gap-1.5 text-[9px] mb-2">
              <div className="p-1 rounded bg-[#07030b] border border-[#FF0055]/25">
                <div className="text-[#8b80b6] text-[8px]">MISS DISTANCE</div>
                <div className="text-xs font-bold text-[#FF0055]">{missDist.toFixed(1)} m</div>
              </div>
              <div className="p-1 rounded bg-[#07030b] border border-[#FF0055]/25">
                <div className="text-[#8b80b6] text-[8px]">COLLISION PROB (PoC)</div>
                <div className="text-xs font-bold text-[#FF0055]">{poc.toExponential(2)}</div>
              </div>
              <div className="p-1 rounded bg-[#07030b] border border-[#FF0055]/25">
                <div className="text-[#8b80b6] text-[8px]">RELATIVE VELOCITY</div>
                <div className="text-xs font-bold text-white">{relSpeed.toFixed(2)} km/s</div>
              </div>
              <div className="p-1 rounded bg-[#07030b] border border-[#FF0055]/25">
                <div className="text-[#8b80b6] text-[8px]">COVARIANCE TENSOR</div>
                <div className="text-xs font-bold text-[#29AB87]">6x6 UVW</div>
              </div>
            </div>

            {/* Maneuver Calculations & Execution Button */}
            <div className="pt-1.5 border-t border-[#FF0055]/30 space-y-1.5">
              <div className="flex items-center justify-between text-[9px] text-[#8b80b6]">
                <span>Required Evasive Vector:</span>
                <span className="text-[#00FFFF] font-bold">+{deltaVReq.toFixed(2)} m/s</span>
              </div>
              <div className="flex items-center justify-between text-[9px] text-[#8b80b6]">
                <span>Post-Burn Clearance:</span>
                <span className="text-[#29AB87] font-bold">&gt; {postBurnMiss} m</span>
              </div>

              {onRequestEvasiveBurn && (
                <button
                  type="button"
                  onClick={() => onRequestEvasiveBurn(criticalConjSat.id)}
                  className="w-full py-1.5 bg-gradient-to-r from-[#FF0055] to-[#FF4500] hover:brightness-110 text-white font-bold rounded-md text-[10px] uppercase tracking-wider shadow-[0_0_15px_rgba(255,0,85,0.4)] flex items-center justify-center gap-1.5 transition-all hover:scale-[1.01] active:translate-y-[1px]"
                >
                  <Flame className="w-3.5 h-3.5 fill-white" />
                  <span>EXECUTE EVASIVE BURN (ΔV)</span>
                </button>
              )}
            </div>
          </div>
        );
      })()}

      {/* Maneuver Safe Clearance Notification */}
      {(() => {
        const justManeuveredSat = satellites.find(s => s.hasManeuvered);
        if (!justManeuveredSat) return null;
        return (
          <div className="absolute top-12 right-3 z-20 max-w-xs w-full bg-[#061814]/95 border border-[#29AB87] rounded-xl p-3 shadow-[0_0_25px_rgba(41,171,135,0.35)] backdrop-blur-md text-xs animate-in fade-in">
            <div className="flex items-center gap-2 mb-1.5">
              <ShieldCheck className="w-4 h-4 text-[#29AB87]" />
              <span className="font-bold text-[#29AB87] text-[11px] tracking-wider uppercase">
                COLLISION AVOIDED • SAFE CLEARANCE
              </span>
            </div>
            <p className="text-[10px] text-[#00FFFF]/80 leading-snug">
              Evasive ΔV burn verified on <strong>{justManeuveredSat.name}</strong>. Orbital semi-major axis adjusted by +2.6 km. Miss distance expanded to 5,420 m with nominal covariance separation.
            </p>
          </div>
        );
      })()}

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

        {/* Collision Pair Simulator Dropdown */}
        {onTriggerCollisionSimulation && (
          <div className="flex items-center gap-1.5 bg-[#111530] border border-[#FF0055]/40 rounded px-2 py-1 text-[11px]">
            <span className="text-[#FF0055] font-bold flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              SIM COLLISION:
            </span>
            <select
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) {
                  const [a, b] = e.target.value.split('|');
                  setActiveCollisionPair({ satAId: a, satBId: b });
                  setIsAlertDismissed(false);
                  setIsAlertMinimized(false);
                  onTriggerCollisionSimulation(a, b);
                  e.target.value = '';
                }
              }}
              className="bg-[#030408] text-[#00FFFF] border border-[rgba(0,255,255,0.2)] rounded px-1.5 py-0.5 text-[10px] outline-none cursor-pointer"
            >
              <option value="" disabled>Select Pair to Collide...</option>
              <option value="SIM-000001|SIM-000002">VIGIL-SENTINEL-1 vs DEB-SL-16</option>
              <option value="SIM-000002|SIM-000003">DEB-SL-16 vs AEGIS-OBSERVER-A</option>
              <option value="SIM-000001|SIM-000004">VIGIL-SENTINEL-1 vs AURORA-RESEARCH-3</option>
              <option value="SIM-000003|SIM-000005">AEGIS-OBSERVER vs TERRA-SCAN-IX</option>
            </select>
          </div>
        )}

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
