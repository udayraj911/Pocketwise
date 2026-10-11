/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface DimensionalBalanceRingProps {
  spentRatio?: number; // 0 to 1
  remainingRatio?: number; // 0 to 1
  remainingBalance?: number;
  totalIncome?: number;
  spentSoFar?: number;
  unpaidEssentials?: number;
  emergencyBuffer?: number;
  className?: string;
}

function BalanceVaultScene({
  spentRatio,
  remainingRatio,
}: {
  spentRatio: number;
  remainingRatio: number;
}) {
  const torusRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (torusRef.current) {
      torusRef.current.rotation.z = t * 0.2;
    }
    if (coreRef.current) {
      coreRef.current.rotation.y = t * 0.4;
      coreRef.current.rotation.x = Math.sin(t * 0.6) * 0.2;
    }
  });

  return (
    <>
      <ambientLight intensity={1.2} />
      <directionalLight position={[3, 5, 4]} intensity={1.8} color="#D4F478" />
      <directionalLight position={[-3, -3, -2]} intensity={0.8} color="#1E5225" />

      {/* Main Outer Vault Ring */}
      <mesh ref={torusRef} rotation={[0.5, 0.2, 0]}>
        <torusGeometry args={[1.3, 0.12, 16, 64]} />
        <meshStandardMaterial
          color="#133226"
          emissive="#D4F478"
          emissiveIntensity={0.25}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* Dynamic Spent & Remaining Glowing Inner Orbs */}
      <group ref={coreRef}>
        <mesh position={[0, 0, 0]}>
          <icosahedronGeometry args={[0.65, 1]} />
          <meshStandardMaterial
            color="#2E7554"
            emissive="#D4F478"
            emissiveIntensity={0.5}
            roughness={0.15}
            metalness={0.6}
            transparent
            opacity={0.85}
          />
        </mesh>
        <mesh scale={0.75}>
          <octahedronGeometry args={[0.5, 0]} />
          <meshBasicMaterial color="#FFFFFF" wireframe />
        </mesh>
      </group>
    </>
  );
}

export const DimensionalBalanceRing: React.FC<DimensionalBalanceRingProps> = ({
  spentRatio,
  remainingRatio,
  remainingBalance = 0,
  totalIncome = 1,
  spentSoFar = 0,
  className = '',
}) => {
  const tot = totalIncome || 1;
  const remRatio = remainingRatio ?? Math.max(0, Math.min(1, remainingBalance / tot));
  const spRatio = spentRatio ?? Math.max(0, Math.min(1, spentSoFar / tot));

  return (
    <div className={`relative w-28 h-28 sm:w-32 sm:h-32 shrink-0 ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 4.2], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
      >
        <BalanceVaultScene spentRatio={spRatio} remainingRatio={remRatio} />
      </Canvas>
    </div>
  );
};
