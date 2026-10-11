/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Visual Concept: "The Living Financial Landscape"
 * A sophisticated, continuously animated 3D environment inspired by premium architectural visualization
 * and high-end fintech product websites.
 *
 * Key Enhancements:
 * - Scroll-linked camera movement providing deep atmospheric parallax across dashboard sections.
 * - Soft directional studio lighting with dynamic shadow maps and grounded contact ambient occlusion plane.
 * - Warm ivory background (#FAF8F5) matching the Pocketwise visual theme.
 * - Translucent glass monoliths with true depth, rounded edges, and shadow reception.
 * - Smoothly flowing emerald, sage, and metallic-gold growth ribbons.
 */

// Helper to construct a 2D rounded rectangle shape for Three.js extrusion
function createRoundedRectShape(width: number, height: number, radius: number): THREE.Shape {
  const shape = new THREE.Shape();
  const x = -width / 2;
  const y = -height / 2;
  const r = Math.min(radius, width / 2, height / 2);

  shape.moveTo(x + r, y);
  shape.lineTo(x + width - r, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + r);
  shape.lineTo(x + width, y + height - r);
  shape.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  shape.lineTo(x + r, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);

  return shape;
}

// Architectural Translucent Glass Structure with Real Depth, Rounded Edges, and Shadow Casting
function ArchitecturalGlassStructure({
  position,
  width,
  height,
  depth = 0.5,
  radius = 0.35,
  rotation = [0, 0, 0],
}: {
  position: [number, number, number];
  width: number;
  height: number;
  depth?: number;
  radius?: number;
  rotation?: [number, number, number];
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const initialY = position[1];

  const geometry = useMemo(() => {
    const shape = createRoundedRectShape(width, height, radius);
    return new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 1,
      bevelSize: 0.1,
      bevelThickness: 0.1,
    });
  }, [width, height, depth, radius]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    // Calm architectural breathing elevation
    meshRef.current.position.y = initialY + Math.sin(t * 0.18 + position[0]) * 0.1;
    meshRef.current.rotation.y = rotation[1] + Math.sin(t * 0.12 + position[2]) * 0.015;
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={rotation}
      geometry={geometry}
      castShadow
      receiveShadow
    >
      <meshPhysicalMaterial
        color="#EDF5F0"
        roughness={0.12}
        metalness={0.06}
        transmission={0.72}
        transparent
        opacity={0.42}
        ior={1.44}
        reflectivity={0.48}
        clearcoat={0.45}
        clearcoatRoughness={0.15}
      />
    </mesh>
  );
}

// "The Living Financial Landscape" Continuous Curves & Guided Capital Particles
function LivingLandscapeRibbons({
  scrollRatio,
  prefersReducedMotion,
}: {
  scrollRatio: number;
  prefersReducedMotion: boolean;
}) {
  const emeraldTubeRef = useRef<THREE.Mesh>(null);
  const sageTubeRef = useRef<THREE.Mesh>(null);
  const goldTubeRef = useRef<THREE.Mesh>(null);
  const fineTubeRef = useRef<THREE.Mesh>(null);
  const particlesGroupRef = useRef<THREE.Group>(null);

  // 1. Primary Emerald Growth Spline
  const emeraldBasePoints = useMemo(() => {
    return [
      new THREE.Vector3(-20, -5.2, -14.5),
      new THREE.Vector3(-11, -3.2, -12.2),
      new THREE.Vector3(-2.5, -0.7, -10.5),
      new THREE.Vector3(5.2, 1.3, -10.0),
      new THREE.Vector3(13.0, 2.7, -12.6),
      new THREE.Vector3(21.5, 4.0, -15.2),
    ];
  }, []);

  // 2. Muted Sage Counter-Curve Spline
  const sageBasePoints = useMemo(() => {
    return [
      new THREE.Vector3(-21, 3.2, -16.5),
      new THREE.Vector3(-10.5, 1.6, -14.8),
      new THREE.Vector3(0.5, -0.6, -13.2),
      new THREE.Vector3(8.5, -1.8, -14.2),
      new THREE.Vector3(19.0, -2.7, -17.8),
    ];
  }, []);

  // 3. Sculptural Metallic-Gold Progress Curve
  const goldBasePoints = useMemo(() => {
    return [
      new THREE.Vector3(-16.0, -4.5, -9.6),
      new THREE.Vector3(-6.5, -2.3, -8.4),
      new THREE.Vector3(2.5, 0.5, -8.1),
      new THREE.Vector3(10.2, 2.9, -9.2),
      new THREE.Vector3(18.0, 4.8, -11.6),
    ];
  }, []);

  // 4. Fine Accent Guideline Spline
  const fineBasePoints = useMemo(() => {
    return [
      new THREE.Vector3(-18.0, -3.8, -11.2),
      new THREE.Vector3(-8.0, -1.8, -9.8),
      new THREE.Vector3(1.5, 0.1, -9.4),
      new THREE.Vector3(9.0, 2.1, -10.8),
      new THREE.Vector3(17.5, 3.6, -13.0),
    ];
  }, []);

  // Construct smooth CatmullRom splines
  const emeraldCurve = useMemo(
    () => new THREE.CatmullRomCurve3(emeraldBasePoints, false, 'centripetal'),
    [emeraldBasePoints]
  );
  const sageCurve = useMemo(
    () => new THREE.CatmullRomCurve3(sageBasePoints, false, 'centripetal'),
    [sageBasePoints]
  );
  const goldCurve = useMemo(
    () => new THREE.CatmullRomCurve3(goldBasePoints, false, 'centripetal'),
    [goldBasePoints]
  );
  const fineCurve = useMemo(
    () => new THREE.CatmullRomCurve3(fineBasePoints, false, 'centripetal'),
    [fineBasePoints]
  );

  // Smooth tube geometries
  const emeraldGeometry = useMemo(
    () => new THREE.TubeGeometry(emeraldCurve, 140, 0.42, 18, false),
    [emeraldCurve]
  );
  const sageGeometry = useMemo(
    () => new THREE.TubeGeometry(sageCurve, 120, 0.28, 16, false),
    [sageCurve]
  );
  const goldGeometry = useMemo(
    () => new THREE.TubeGeometry(goldCurve, 120, 0.18, 18, false),
    [goldCurve]
  );
  const fineGeometry = useMemo(
    () => new THREE.TubeGeometry(fineCurve, 100, 0.08, 12, false),
    [fineCurve]
  );

  // Guided capital flow particles
  const particleCount = 20;
  const particleData = useMemo(() => {
    return Array.from({ length: particleCount }).map((_, i) => ({
      curveType: i % 3 === 0 ? 'gold' : 'emerald',
      u: (i / particleCount) + (i % 5) * 0.02,
      speed: 0.012 + (i % 4) * 0.004,
      scale: 0.065 + (i % 2) * 0.03,
      color: i % 3 === 0 ? '#FDE047' : '#D4F478',
    }));
  }, [particleCount]);

  useFrame(({ clock }) => {
    if (prefersReducedMotion) return;

    const t = clock.getElapsedTime();

    // Subtle continuous breathing undulation on emerald ribbon
    if (emeraldTubeRef.current) {
      emeraldTubeRef.current.position.y = Math.sin(t * 0.16) * 0.22;
      emeraldTubeRef.current.position.z = Math.cos(t * 0.12) * 0.18;
    }

    // Gentle counter-drift on sage ribbon
    if (sageTubeRef.current) {
      sageTubeRef.current.position.y = Math.cos(t * 0.14) * 0.18;
    }

    // Sculptural gold curve responding softly to scroll depth
    if (goldTubeRef.current) {
      const scrollLift = scrollRatio * 1.1;
      goldTubeRef.current.position.y = THREE.MathUtils.lerp(
        goldTubeRef.current.position.y,
        Math.sin(t * 0.19) * 0.15 + scrollLift * 0.35,
        0.04
      );
    }

    // Fine accent guideline
    if (fineTubeRef.current) {
      fineTubeRef.current.position.y = Math.sin(t * 0.15 + 1.2) * 0.16;
    }

    // Guided capital particles moving along splines
    if (particlesGroupRef.current) {
      particlesGroupRef.current.children.forEach((child, idx) => {
        const p = particleData[idx];
        if (!p) return;

        p.u = (p.u + p.speed * 0.01) % 1;
        const targetCurve = p.curveType === 'gold' ? goldCurve : emeraldCurve;
        const pt = targetCurve.getPoint(p.u);

        const yOffset =
          p.curveType === 'emerald' && emeraldTubeRef.current
            ? emeraldTubeRef.current.position.y
            : goldTubeRef.current
            ? goldTubeRef.current.position.y
            : 0;

        child.position.set(pt.x, pt.y + yOffset, pt.z + 0.15);
      });
    }
  });

  return (
    <group>
      {/* 1. Primary Emerald Architectural Ribbon */}
      <mesh ref={emeraldTubeRef} geometry={emeraldGeometry} castShadow receiveShadow>
        <meshPhysicalMaterial
          color="#103A24"
          roughness={0.25}
          metalness={0.26}
          reflectivity={0.45}
          clearcoat={0.35}
          clearcoatRoughness={0.18}
          emissive="#0A2818"
          emissiveIntensity={0.22}
        />
      </mesh>

      {/* 2. Muted Sage Counter-Curve Ribbon */}
      <mesh ref={sageTubeRef} geometry={sageGeometry} castShadow receiveShadow>
        <meshStandardMaterial
          color="#5C7C6A"
          roughness={0.44}
          metalness={0.12}
          transparent
          opacity={0.88}
        />
      </mesh>

      {/* 3. Sculptural Metallic-Gold Progress Curve */}
      <mesh ref={goldTubeRef} geometry={goldGeometry} castShadow receiveShadow>
        <meshStandardMaterial
          color="#D4AF37"
          roughness={0.18}
          metalness={0.86}
          emissive="#7A5E12"
          emissiveIntensity={0.18}
        />
      </mesh>

      {/* 4. Fine Jade Accent Guideline */}
      <mesh ref={fineTubeRef} geometry={fineGeometry} castShadow receiveShadow>
        <meshStandardMaterial
          color="#749683"
          roughness={0.35}
          metalness={0.2}
          transparent
          opacity={0.65}
        />
      </mesh>

      {/* 5. Guided Capital Flow Particles */}
      <group ref={particlesGroupRef}>
        {particleData.map((p, i) => (
          <mesh key={i} scale={p.scale} castShadow>
            <sphereGeometry args={[1, 14, 14]} />
            <meshStandardMaterial
              color={p.color}
              emissive={p.color}
              emissiveIntensity={0.8}
              roughness={0.12}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// Grounded Contact Plane with Soft Ambient Shadow Reception
function HorizonAtmosphereAndGround() {
  return (
    <group position={[0, -6.8, -20]}>
      {/* Shadow receiving horizon ground plane for ambient occlusion feel */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[100, 60]} />
        <meshStandardMaterial
          color="#FAF8F5"
          roughness={0.95}
          metalness={0.01}
          transparent
          opacity={0.85}
        />
      </mesh>
    </group>
  );
}

// Scroll-Linked Cinematic Camera Director
function LivingLandscapeCameraDirector({
  scrollRatio,
  prefersReducedMotion,
}: {
  scrollRatio: number;
  prefersReducedMotion: boolean;
}) {
  const { camera, pointer } = useThree();
  const currentTarget = useRef(new THREE.Vector3(0, -0.4, -12));
  const currentPos = useRef(new THREE.Vector3(0, 1.25, 11.5));

  useFrame(({ clock }) => {
    if (prefersReducedMotion) {
      camera.position.set(0, 0.55, 12);
      camera.lookAt(0, -0.2, -12);
      return;
    }

    const t = clock.getElapsedTime();

    // 1. Subtle continuous drift (Lissajous figure)
    const driftX = Math.sin(t * 0.08) * 0.45;
    const driftY = Math.cos(t * 0.065) * 0.28;

    // 2. Parallax mouse tracking
    const mouseX = pointer.x * 0.35;
    const mouseY = pointer.y * 0.18;

    // 3. Dynamic Scroll-Linked Parallax Camera Progression:
    // Glides gently as user scrolls through dashboard sections:
    // Overview (scroll 0.0) -> Forecast & Health (0.25) -> Simulator (0.50) -> Commitments (0.75) -> Savings & Gamification (1.0)
    const scrollTargetY = THREE.MathUtils.lerp(1.25, -2.8, scrollRatio);
    const scrollTargetZ = THREE.MathUtils.lerp(11.5, 13.5, scrollRatio);
    const scrollTargetX = THREE.MathUtils.lerp(0, 0.95, Math.sin(scrollRatio * Math.PI));

    const destX = driftX + mouseX + scrollTargetX;
    const destY = scrollTargetY + driftY + mouseY;
    const destZ = scrollTargetZ;

    // Smooth lerp damping to ensure buttery motion
    currentPos.current.lerp(new THREE.Vector3(destX, destY, destZ), 0.04);
    camera.position.copy(currentPos.current);

    // Camera target subtly shifts look-at depth as scrolling progresses
    const targetLookY = THREE.MathUtils.lerp(-0.4, -3.1, scrollRatio);
    const targetLookX = THREE.MathUtils.lerp(0, -0.3, scrollRatio);
    currentTarget.current.lerp(new THREE.Vector3(targetLookX, targetLookY, -12), 0.04);
    camera.lookAt(currentTarget.current);

    // Subtle atmospheric roll tilt linked to scroll
    camera.rotation.z = THREE.MathUtils.lerp(0, 0.015 * Math.sin(scrollRatio * Math.PI), 0.04);
  });

  return null;
}

/**
 * Emerald3DEnvironment
 * "The Living Financial Landscape"
 *
 * Cleanly art-directed 3D landscape:
 * - Flowing emerald and sage growth ribbons
 * - Sculptural metallic-gold progress curve
 * - Translucent glass architectural monoliths with rounded edges
 * - Soft directional studio lighting with dynamic ambient shadow maps
 * - Scroll-linked camera movement creating atmospheric parallax depth
 */
export const Emerald3DEnvironment: React.FC = () => {
  const [scrollRatio, setScrollRatio] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Track window scroll with passive listener
  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight > 0) {
        setScrollRatio(Math.min(1, Math.max(0, window.scrollY / scrollHeight)));
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    // Check reduced motion media query
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mql.matches);
    const handleMql = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mql.addEventListener('change', handleMql);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      mql.removeEventListener('change', handleMql);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      aria-hidden="true"
      style={{ opacity: 0.94 }}
    >
      <Canvas
        shadows
        camera={{ position: [0, 1.25, 11.5], fov: 46, near: 0.1, far: 95 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
      >
        {/* Warm Ivory Atmospheric Base & Soft Fog */}
        <color attach="background" args={['#FAF8F5']} />
        <fog attach="fog" args={['#FAF8F5', 18, 55]} />

        {/* Studio Directional Lighting & Soft Ambient Shadows */}
        <ambientLight intensity={1.05} color="#FFFDF5" />
        
        {/* Key Directional Light with Shadow Map for Grounding */}
        <directionalLight
          position={[14, 22, 12]}
          intensity={1.25}
          color="#FFF8EC"
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-near={0.5}
          shadow-camera-far={50}
          shadow-camera-left={-22}
          shadow-camera-right={22}
          shadow-camera-top={22}
          shadow-camera-bottom={-22}
          shadow-bias={-0.00015}
        />

        {/* Soft Cool Sage Fill Light */}
        <directionalLight
          position={[-12, 8, 8]}
          intensity={0.55}
          color="#BACDBF"
        />

        {/* Golden Specular Point Light for Metallic Progress Curve */}
        <pointLight
          position={[8, -1, 5]}
          intensity={0.7}
          color="#FDE047"
          distance={38}
        />

        {/* Scroll-Adaptive Camera Director with Parallax Drift */}
        <LivingLandscapeCameraDirector
          scrollRatio={scrollRatio}
          prefersReducedMotion={prefersReducedMotion}
        />

        {/* Distant Horizon & Ground Plane with Ambient Shadow Reception */}
        <HorizonAtmosphereAndGround />

        {/* Translucent Architectural Glass Monoliths */}
        <ArchitecturalGlassStructure
          position={[-12.5, -0.6, -16.5]}
          width={3.6}
          height={8.8}
          depth={0.6}
          radius={0.4}
          rotation={[0.03, 0.36, 0]}
        />
        <ArchitecturalGlassStructure
          position={[14.0, 1.3, -19.5]}
          width={4.2}
          height={10.2}
          depth={0.65}
          radius={0.45}
          rotation={[-0.03, -0.32, 0]}
        />
        <ArchitecturalGlassStructure
          position={[-2.0, -3.4, -23.5]}
          width={7.2}
          height={4.4}
          depth={0.5}
          radius={0.35}
          rotation={[0.02, 0.08, 0.02]}
        />
        <ArchitecturalGlassStructure
          position={[-15.5, 4.2, -18.5]}
          width={2.6}
          height={2.6}
          depth={0.45}
          radius={0.3}
          rotation={[0.05, 0.25, 0.04]}
        />

        {/* Living Landscape Ribbons & Guided Capital Flow Particles */}
        <LivingLandscapeRibbons
          scrollRatio={scrollRatio}
          prefersReducedMotion={prefersReducedMotion}
        />
      </Canvas>
    </div>
  );
};
