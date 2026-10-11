/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  ArrowRight,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Layers,
  Compass,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

export interface CinematicStartupSequenceProps {
  onComplete: () => void;
  isAuthenticated?: boolean;
}

// -------------------------------------------------------------
// SCENE 1 & 4 & 5: Dimentional Architectural Columns & Portals
// -------------------------------------------------------------
function ArchitecturalPortalGateway({
  progress,
}: {
  progress: number;
}) {
  const portalRef = useRef<THREE.Group>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ring1Ref.current) ring1Ref.current.rotation.z = t * 0.35;
    if (ring2Ref.current) ring2Ref.current.rotation.x = t * 0.25;
    if (ring3Ref.current) ring3Ref.current.rotation.y = t * 0.3;
  });

  // Portal appears in Scene 3, 4, 5 (progress > 0.45)
  const portalOpacity = Math.min(1, Math.max(0, (progress - 0.42) * 4));
  const portalScale = Math.min(1, Math.max(0.2, (progress - 0.4) * 2.2));

  return (
    <group ref={portalRef} position={[0, 0, -18]} scale={portalScale}>
      {/* Outer Monolithic Columns */}
      {[-5, 5].map((x, i) => (
        <mesh key={i} position={[x, 0, 0]}>
          <boxGeometry args={[0.8, 14, 0.8]} />
          <meshStandardMaterial
            color="#0B2318"
            emissive="#123B29"
            emissiveIntensity={0.5}
            roughness={0.2}
            metalness={0.8}
            transparent
            opacity={portalOpacity * 0.85}
          />
        </mesh>
      ))}

      {/* Top Architectural Lintel Beam */}
      <mesh position={[0, 6.6, 0]}>
        <boxGeometry args={[11.2, 0.8, 0.8]} />
        <meshStandardMaterial
          color="#0B2318"
          emissive="#2E7554"
          emissiveIntensity={0.6}
          roughness={0.2}
          metalness={0.8}
          transparent
          opacity={portalOpacity * 0.85}
        />
      </mesh>

      {/* Concentric Gyroscopic Financial Rings */}
      <mesh ref={ring1Ref}>
        <torusGeometry args={[4.2, 0.08, 16, 64]} />
        <meshStandardMaterial
          color="#D4F478"
          emissive="#72B340"
          emissiveIntensity={0.9}
          roughness={0.2}
          transparent
          opacity={portalOpacity * 0.75}
        />
      </mesh>
      <mesh ref={ring2Ref} rotation={[Math.PI / 4, 0, 0]}>
        <torusGeometry args={[3.4, 0.06, 16, 64]} />
        <meshStandardMaterial
          color="#2E7554"
          emissive="#D4F478"
          emissiveIntensity={0.7}
          roughness={0.2}
          transparent
          opacity={portalOpacity * 0.65}
        />
      </mesh>
      <mesh ref={ring3Ref} rotation={[0, Math.PI / 4, 0]}>
        <torusGeometry args={[2.6, 0.05, 16, 64]} />
        <meshStandardMaterial
          color="#FFF275"
          emissive="#FDE047"
          emissiveIntensity={0.8}
          roughness={0.1}
          transparent
          opacity={portalOpacity * 0.75}
        />
      </mesh>

      {/* Center Dimensional Portal Aura */}
      <mesh position={[0, 0, -0.2]}>
        <circleGeometry args={[2.5, 32]} />
        <meshBasicMaterial
          color="#13432E"
          transparent
          opacity={portalOpacity * (progress > 0.85 ? 0.95 : 0.4)}
        />
      </mesh>

      <pointLight
        position={[0, 0, 1]}
        color="#D4F478"
        intensity={progress > 0.8 ? 6 : 2 * portalOpacity}
        distance={25}
      />
    </group>
  );
}

// -------------------------------------------------------------
// SCENE 2: The 3D Pocketwise Logo with Light-Tracing Path
// -------------------------------------------------------------
function PocketwiseEmblem3D({
  progress,
}: {
  progress: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const photonRef = useRef<THREE.Mesh>(null);

  // 1. Extruded Pocket Shape Geometry
  const pocketShape = useMemo(() => {
    const s = new THREE.Shape();
    const w = 1.6;
    const topY = 1.5;
    const botY = -1.5;
    const radius = 0.3;

    s.moveTo(-w + radius, topY);
    s.lineTo(w - radius, topY);
    s.quadraticCurveTo(w, topY, w, topY - radius);
    s.lineTo(w, 0.1);
    s.bezierCurveTo(w, -0.9, 0.7, botY, 0, botY - 0.2);
    s.bezierCurveTo(-0.7, botY, -w, -0.9, -w, 0.1);
    s.lineTo(-w, topY - radius);
    s.quadraticCurveTo(-w, topY, -w + radius, topY);

    return s;
  }, []);

  const extrudeSettings = useMemo(
    () => ({
      depth: 0.28,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 1,
      bevelSize: 0.07,
      bevelThickness: 0.07,
    }),
    []
  );

  // 2. Growth Trajectory Spline Curve
  const growthCurve = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1.0, -0.55, 0.35),
      new THREE.Vector3(-0.35, -0.35, 0.4),
      new THREE.Vector3(0.3, 0.2, 0.45),
      new THREE.Vector3(1.0, 0.95, 0.5),
    ]);
  }, []);

  const curvePoints = useMemo(() => growthCurve.getPoints(50), [growthCurve]);

  // Dynamic light tracing calculation for Scene 2 (0.20 to 0.46)
  const isScene2OrLater = progress >= 0.18;
  const traceRatio = Math.min(1, Math.max(0, (progress - 0.2) / 0.24));

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();

    // Subtle breathing float
    groupRef.current.position.y = Math.sin(t * 1.4) * 0.08;
    groupRef.current.rotation.y = Math.sin(t * 0.7) * 0.1;

    // Photon light traversal
    if (photonRef.current && isScene2OrLater) {
      const pos = growthCurve.getPoint(traceRatio);
      photonRef.current.position.copy(pos);
      photonRef.current.scale.setScalar(
        traceRatio > 0 && traceRatio < 1 ? 1.2 + Math.sin(t * 18) * 0.4 : traceRatio >= 1 ? 1.8 : 0.001
      );
    }

    if (lightRef.current) {
      const pos = growthCurve.getPoint(traceRatio);
      lightRef.current.position.set(pos.x, pos.y, pos.z + 0.25);
      lightRef.current.intensity = isScene2OrLater ? 3.5 : 0;
    }
  });

  // Calculate Bar dynamic heights during reveal
  const bar1Scale = Math.min(1, Math.max(0, (progress - 0.24) / 0.1));
  const bar2Scale = Math.min(1, Math.max(0, (progress - 0.3) / 0.1));
  const bar3Scale = Math.min(1, Math.max(0, (progress - 0.36) / 0.1));
  const apexActive = progress >= 0.42;

  // Fade out emblem as camera travels past in Scene 3
  const emblemFade = progress > 0.55 ? Math.max(0, 1 - (progress - 0.55) * 5) : 1;

  if (emblemFade <= 0) return null;

  return (
    <group ref={groupRef} position={[0, 0.3, 0]} scale={emblemFade}>
      {/* 1. Outer Extruded Pocket Shell */}
      <mesh position={[0, 0, -0.14]}>
        <extrudeGeometry args={[pocketShape, extrudeSettings]} />
        <meshStandardMaterial
          color="#0B261A"
          roughness={0.25}
          metalness={0.7}
          emissive="#123B29"
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Recessed Pocket Lining */}
      <mesh position={[0, 0, 0.15]}>
        <planeGeometry args={[2.5, 2.5]} />
        <meshStandardMaterial
          color="#13432E"
          roughness={0.3}
          metalness={0.3}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* 2. Rising Financial Bars (Plan, Track, Grow) */}
      {/* Bar 1 (Plan) */}
      <group position={[-0.6, -0.55 + (bar1Scale * 0.45) / 2, 0.22]}>
        <mesh scale={[0.24, Math.max(0.01, bar1Scale * 0.6), 0.12]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            color="#3B7D4E"
            emissive="#72B340"
            emissiveIntensity={bar1Scale * 0.7}
            roughness={0.2}
            metalness={0.5}
          />
        </mesh>
      </group>

      {/* Bar 2 (Track) */}
      <group position={[0, -0.4 + (bar2Scale * 0.7) / 2, 0.22]}>
        <mesh scale={[0.24, Math.max(0.01, bar2Scale * 0.95), 0.12]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            color="#4E995F"
            emissive="#B2EB5C"
            emissiveIntensity={bar2Scale * 0.8}
            roughness={0.2}
            metalness={0.5}
          />
        </mesh>
      </group>

      {/* Bar 3 (Grow) */}
      <group position={[0.6, -0.2 + (bar3Scale * 0.95) / 2, 0.22]}>
        <mesh scale={[0.24, Math.max(0.01, bar3Scale * 1.35), 0.12]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            color="#72B340"
            emissive="#D4F478"
            emissiveIntensity={bar3Scale * 0.95}
            roughness={0.2}
            metalness={0.5}
          />
        </mesh>
      </group>

      {/* 3. Glowing Growth Spline Ribbon */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[
              new Float32Array(curvePoints.flatMap((pt) => [pt.x, pt.y, pt.z])),
              3,
            ]}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color="#D4F478"
          linewidth={3}
          transparent
          opacity={Math.min(1, Math.max(0.1, (progress - 0.2) * 3))}
        />
      </line>

      {/* 4. Active Traveling Photon Tracer */}
      <mesh ref={photonRef}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color="#FFFFFF" />
      </mesh>
      <pointLight ref={lightRef} color="#D4F478" distance={4.5} />

      {/* 5. Apex Wealth Star Node */}
      <group position={[1.0, 0.95, 0.5]}>
        <mesh scale={apexActive ? 1 : 0.001}>
          <octahedronGeometry args={[0.15, 0]} />
          <meshStandardMaterial
            color="#FFF275"
            emissive="#FDE047"
            emissiveIntensity={1.8}
            roughness={0.1}
          />
        </mesh>
        {apexActive && <pointLight color="#FFF275" intensity={4} distance={6} />}
      </group>
    </group>
  );
}

// -------------------------------------------------------------
// SCENE 1 & 3: Undulating Glowing Financial Pathways
// -------------------------------------------------------------
function DistantFinancialRibbonPathways({ progress }: { progress: number }) {
  const line1Ref = useRef<THREE.Line>(null);
  const line2Ref = useRef<THREE.Line>(null);
  const line3Ref = useRef<THREE.Line>(null);

  const count = 70;
  const geom1 = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= count; i++) {
      const z = -40 + (i / count) * 45;
      pts.push(new THREE.Vector3(Math.sin(z * 0.15) * 3 - 2, -1.8, z));
    }
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, []);

  const geom2 = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= count; i++) {
      const z = -40 + (i / count) * 45;
      pts.push(new THREE.Vector3(-Math.sin(z * 0.12) * 3.5 + 2.5, -1.6, z));
    }
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * 0.6;
    if (line1Ref.current) {
      const pos = geom1.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i <= count; i++) {
        const z = -40 + (i / count) * 45;
        pos.setXYZ(i, Math.sin(z * 0.15 + t) * 3 - 2, -1.8 + Math.cos(z * 0.1 + t) * 0.5, z);
      }
      pos.needsUpdate = true;
    }
  });

  return (
    <>
      <primitive
        ref={line1Ref}
        object={
          new THREE.Line(
            geom1,
            new THREE.LineBasicMaterial({
              color: new THREE.Color('#D4F478'),
              transparent: true,
              opacity: 0.55,
              linewidth: 2,
            })
          )
        }
      />
      <primitive
        ref={line2Ref}
        object={
          new THREE.Line(
            geom2,
            new THREE.LineBasicMaterial({
              color: new THREE.Color('#3B7D4E'),
              transparent: true,
              opacity: 0.45,
              linewidth: 2,
            })
          )
        }
      />
    </>
  );
}

// -------------------------------------------------------------
// SCENE 1, 3, 4: Deep Stardust & Floating Crystals
// -------------------------------------------------------------
function FloatingEmeraldConstellation() {
  const crystals = useMemo(() => {
    return [
      { pos: [-6, 3, -4] as [number, number, number], scale: 1.1, col: '#1C4736' },
      { pos: [6.5, -2, -6] as [number, number, number], scale: 1.4, col: '#2E7554' },
      { pos: [-4.5, -3, -12] as [number, number, number], scale: 1.6, col: '#133827' },
      { pos: [5, 4, -14] as [number, number, number], scale: 1.3, col: '#3B7D4E' },
      { pos: [-3, 5, -22] as [number, number, number], scale: 2.0, col: '#0F3826' },
      { pos: [3.5, -4, -25] as [number, number, number], scale: 2.2, col: '#1C4736' },
    ];
  }, []);

  return (
    <group>
      {crystals.map((c, i) => (
        <mesh key={i} position={c.pos} scale={c.scale}>
          <octahedronGeometry args={[1, 1]} />
          <meshStandardMaterial
            color={c.col}
            emissive="#2E7554"
            emissiveIntensity={0.35}
            roughness={0.2}
            metalness={0.5}
            transparent
            opacity={0.65}
          />
        </mesh>
      ))}
    </group>
  );
}

// -------------------------------------------------------------
// CHOREOGRAPHED 5-STAGE CINEMATIC CAMERA JOURNEY
// -------------------------------------------------------------
function ChoreographedCameraJourney({
  progress,
  isTransitioning,
}: {
  progress: number;
  isTransitioning: boolean;
}) {
  const { camera } = useThree();

  useFrame(() => {
    if (isTransitioning) {
      // Rapid forward acceleration into portal / dashboard
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, -19.5, 0.08);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, 0, 0.08);
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, 0, 0.08);
      camera.lookAt(0, 0, -25);
      return;
    }

    // 5 Distinct Choreographed Camera Stages:
    // Stage 1 (0.00 -> 0.22): Deep Dark Void Overview
    // Stage 2 (0.22 -> 0.44): Logo Inception Close-up
    // Stage 3 (0.44 -> 0.68): Dimensional Flight Journey through structures
    // Stage 4 (0.68 -> 0.88): Arrival at Financial World & Central Portal
    // Stage 5 (0.88 -> 1.00): Approach and Passage into the Portal

    let targetX = 0;
    let targetY = 0;
    let targetZ = 12;
    let lookTargetZ = -10;

    if (progress < 0.22) {
      // Scene 1: High angled perspective overlooking dark emerald void
      const p1 = progress / 0.22;
      targetX = THREE.MathUtils.lerp(-4.5, -1.5, p1);
      targetY = THREE.MathUtils.lerp(4.0, 1.8, p1);
      targetZ = THREE.MathUtils.lerp(18.0, 11.0, p1);
      lookTargetZ = THREE.MathUtils.lerp(-15, 0, p1);
    } else if (progress < 0.44) {
      // Scene 2: Centers in on the 3D Logo Reveal & Light Trace
      const p2 = (progress - 0.22) / 0.22;
      targetX = THREE.MathUtils.lerp(-1.5, 0, p2);
      targetY = THREE.MathUtils.lerp(1.8, 0.35, p2);
      targetZ = THREE.MathUtils.lerp(11.0, 6.2, p2);
      lookTargetZ = 0;
    } else if (progress < 0.68) {
      // Scene 3: Genuine 3D Camera Flight through the environment!
      const p3 = (progress - 0.44) / 0.24;
      // Banks smoothly left and right past floating structures
      targetX = Math.sin(p3 * Math.PI) * 2.8;
      targetY = THREE.MathUtils.lerp(0.35, -0.5, p3) + Math.cos(p3 * Math.PI * 1.5) * 0.6;
      targetZ = THREE.MathUtils.lerp(6.2, -6.0, p3);
      lookTargetZ = targetZ - 12;
    } else if (progress < 0.88) {
      // Scene 4: Financial Realm & Central Vault Gateway Reveal
      const p4 = (progress - 0.68) / 0.2;
      targetX = THREE.MathUtils.lerp(0.8, 0, p4);
      targetY = THREE.MathUtils.lerp(0.5, 0.1, p4);
      targetZ = THREE.MathUtils.lerp(-6.0, -11.5, p4);
      lookTargetZ = -18;
    } else {
      // Scene 5: Approaching Central Portal to enter Pocketwise
      const p5 = (progress - 0.88) / 0.12;
      targetX = 0;
      targetY = 0;
      targetZ = THREE.MathUtils.lerp(-11.5, -16.8, p5);
      lookTargetZ = -22;
    }

    camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, 0.055);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 0.055);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.055);
    camera.lookAt(0, targetY * 0.5, lookTargetZ);
  });

  return null;
}

// -------------------------------------------------------------
// MAIN COMPONENT: CINEMATIC STARTUP SEQUENCE
// -------------------------------------------------------------
export const CinematicStartupSequence: React.FC<CinematicStartupSequenceProps> = ({
  onComplete,
  isAuthenticated = false,
}) => {
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const pausedAtRef = useRef<number>(0);

  // Check reduced motion preference
  const prefersReducedMotion = useMemo(() => {
    return (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }, []);

  // Total cinematic journey runtime: ~8.5 seconds (or rapid if reduced motion)
  const TOTAL_DURATION_MS = prefersReducedMotion ? 600 : 8500;

  useEffect(() => {
    if (prefersReducedMotion) {
      setProgress(1);
      const timer = setTimeout(() => {
        handleEnterDashboard();
      }, 500);
      return () => clearTimeout(timer);
    }

    let animationFrameId: number;

    const animate = (timestamp: number) => {
      if (!isPlaying) return;

      if (!startTimeRef.current) {
        startTimeRef.current = timestamp - pausedAtRef.current * TOTAL_DURATION_MS;
      }

      const elapsed = timestamp - startTimeRef.current;
      const currentProgress = Math.min(1, Math.max(0, elapsed / TOTAL_DURATION_MS));
      setProgress(currentProgress);

      if (currentProgress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        // Automatically smoothly transition into the live dashboard
        setTimeout(() => {
          handleEnterDashboard();
        }, 500);
      }
    };

    if (isPlaying) {
      animationFrameId = requestAnimationFrame(animate);
    }

    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, TOTAL_DURATION_MS, prefersReducedMotion]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === ' ' && e.target === document.body) {
        e.preventDefault();
        setIsPlaying((p) => !p);
      } else if (e.key === 'Enter' || e.key === 'Escape') {
        e.preventDefault();
        handleEnterDashboard();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const handleEnterDashboard = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      onComplete();
    }, 750);
  };

  const handleSeekScene = (targetPct: number) => {
    setProgress(targetPct);
    startTimeRef.current = performance.now() - targetPct * TOTAL_DURATION_MS;
  };

  // Determine current active scene name
  const currentSceneInfo = useMemo(() => {
    if (progress < 0.22) {
      return {
        number: '01',
        title: 'The Dark Emerald Void',
        desc: 'Deep atmospheric 3D architecture & infinite financial pathways',
      };
    } else if (progress < 0.44) {
      return {
        number: '02',
        title: 'Pocketwise Logo Reveal',
        desc: 'Light-tracing along pocket curves & 3D rising financial pillars',
      };
    } else if (progress < 0.68) {
      return {
        number: '03',
        title: 'Dimensional Camera Flight',
        desc: 'Navigating between architectural monoliths & orbital rings',
      };
    } else if (progress < 0.88) {
      return {
        number: '04',
        title: 'The Financial Realm',
        desc: 'Central geometric vault structure & convergence of money flow',
      };
    } else {
      return {
        number: '05',
        title: 'Portal Entry',
        desc: 'Passing through dimensional portal into your personal financial vault',
      };
    }
  }, [progress]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col justify-between bg-[#040E0A] text-white transition-opacity duration-700 overflow-hidden select-none ${
        isTransitioning ? 'opacity-0 pointer-events-none scale-105' : 'opacity-100'
      }`}
      role="dialog"
      aria-label="Pocketwise Cinematic 3D Experience"
    >
      {/* 3D WebGL Canvas spanning the entire viewport */}
      <div className="absolute inset-0 z-0">
        <Canvas
          camera={{ position: [-4.5, 4.0, 18.0], fov: 46, near: 0.1, far: 80 }}
          dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        >
          <color attach="background" args={['#040E0A']} />
          <fog attach="fog" args={['#040E0A', 14, 45]} />

          <ambientLight intensity={0.7} />
          <directionalLight position={[10, 12, 10]} intensity={1.5} color="#D4F478" />
          <pointLight position={[-8, -4, 4]} intensity={2.0} color="#2E7554" distance={25} />
          <pointLight position={[8, 6, -10]} intensity={1.8} color="#FDE047" distance={30} />

          {/* Choreographed Camera Controller */}
          <ChoreographedCameraJourney progress={progress} isTransitioning={isTransitioning} />

          {/* Scene 1 & 3: Distant Undulating Financial Pathways */}
          <DistantFinancialRibbonPathways progress={progress} />

          {/* Scene 1, 3, 4: Floating Emerald Crystals & Constellations */}
          <FloatingEmeraldConstellation />

          {/* Scene 2: 3D Pocketwise Emblem with Light Tracing */}
          <PocketwiseEmblem3D progress={progress} />

          {/* Scene 3, 4, 5: Dimensional Architectural Portal Gateway */}
          <ArchitecturalPortalGateway progress={progress} />
        </Canvas>
      </div>

      {/* TOP HEADER HUD OVERLAY */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-[#D4F478] shadow-[0_0_10px_#D4F478] animate-pulse" />
          <div>
            <span className="text-xs font-bold tracking-widest uppercase text-white">
              POCKETWISE
            </span>
            <span className="text-[10px] text-[#A8C8B5] tracking-wider ml-2 hidden sm:inline">
              CINEMATIC 3D EXPEDITION
            </span>
          </div>
        </div>

        {/* Enter Dashboard / Skip Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-8 h-8 rounded-lg bg-[#0F2D20]/80 border border-[#234E3C] hover:border-[#D4F478] flex items-center justify-center text-[#A8C8B5] hover:text-white transition-colors cursor-pointer"
            title={isPlaying ? 'Pause 3D Camera' : 'Resume 3D Journey'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={handleEnterDashboard}
            className="px-4 py-2 rounded-xl bg-[#D4F478] hover:bg-[#c6e964] text-[#081E15] text-xs font-bold shadow-lg shadow-[#D4F478]/25 transition-all flex items-center gap-2 cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Enter Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* CENTER BRAND WORDMARK IN SCENE 2 */}
      {progress >= 0.22 && progress <= 0.52 && (
        <div className="relative z-10 text-center pointer-events-none transition-opacity duration-700 max-w-md mx-auto">
          <div className="animate-fadeIn">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white drop-shadow-lg">
              Pocketwise
            </h1>
            <p className="text-xs sm:text-sm font-semibold tracking-widest uppercase text-[#D4F478] mt-1 drop-shadow">
              PLAN · TRACK · GROW
            </p>
          </div>
        </div>
      )}

      {/* BOTTOM SCENE SELECTOR & PROGRESS HUD */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-6 pb-6 pointer-events-auto">
        <div className="bg-[#081E15]/85 backdrop-blur-md rounded-2xl p-4 border border-[#234E3C]/80 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div>
              <div className="flex items-center gap-2 text-xs">
                <span className="font-mono font-bold text-[#D4F478]">
                  SCENE {currentSceneInfo.number}
                </span>
                <span className="text-[#8B9B90]">·</span>
                <span className="font-semibold text-white">
                  {currentSceneInfo.title}
                </span>
              </div>
              <p className="text-[11px] text-[#A8C8B5] mt-0.5">
                {currentSceneInfo.desc}
              </p>
            </div>

            <div className="text-xs font-mono text-[#D4F478] self-end sm:self-center">
              {Math.round(progress * 100)}%
            </div>
          </div>

          {/* Interactive 5-Scene Scrubbing Track */}
          <div className="relative w-full h-2 rounded-full bg-[#133827] overflow-hidden mb-3">
            <div
              className="h-full bg-gradient-to-r from-[#3B7D4E] via-[#D4F478] to-[#FDE047] rounded-full transition-all duration-150"
              style={{ width: `${progress * 100}%` }}
            />
          </div>

          {/* 5 Connected Scene Jump Pills */}
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
            {[
              { id: 1, label: '01 Void', pct: 0.05 },
              { id: 2, label: '02 Logo', pct: 0.28 },
              { id: 3, label: '03 Flight', pct: 0.52 },
              { id: 4, label: '04 Realm', pct: 0.74 },
              { id: 5, label: '05 Enter', pct: 0.92 },
            ].map((sc) => {
              const isActive =
                (sc.id === 1 && progress < 0.22) ||
                (sc.id === 2 && progress >= 0.22 && progress < 0.44) ||
                (sc.id === 3 && progress >= 0.44 && progress < 0.68) ||
                (sc.id === 4 && progress >= 0.68 && progress < 0.88) ||
                (sc.id === 5 && progress >= 0.88);

              return (
                <button
                  key={sc.id}
                  onClick={() => handleSeekScene(sc.pct)}
                  className={`py-1 px-1 sm:px-2 rounded-lg text-[10px] sm:text-xs font-semibold transition-all text-center cursor-pointer ${
                    isActive
                      ? 'bg-[#D4F478] text-[#081E15] shadow-xs shadow-[#D4F478]/30 font-bold'
                      : 'bg-[#0E281D] text-[#A8C8B5] hover:bg-[#163B2C] hover:text-white'
                  }`}
                >
                  {sc.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
