/**
 * 3D Cyber Grid Background
 * Three.js powered animated grid
 */

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';

function Grid() {
  const meshRef = useRef();
  const { viewport } = useThree();

  // Create grid geometry
  const gridLines = useMemo(() => {
    const lines = [];
    const size = 100;
    const divisions = 50;
    const step = size / divisions;
    const halfSize = size / 2;

    // Horizontal lines
    for (let i = 0; i <= divisions; i++) {
      const pos = -halfSize + i * step;
      lines.push(
        new THREE.Vector3(-halfSize, pos, 0),
        new THREE.Vector3(halfSize, pos, 0)
      );
    }

    // Vertical lines
    for (let i = 0; i <= divisions; i++) {
      const pos = -halfSize + i * step;
      lines.push(
        new THREE.Vector3(pos, -halfSize, 0),
        new THREE.Vector3(pos, halfSize, 0)
      );
    }

    return new Float32Array(lines.flatMap(v => [v.x, v.y, v.z]));
  }, []);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1 + 0.5;
      meshRef.current.position.z = Math.sin(state.clock.elapsedTime * 0.2) * 2 - 15;
    }
  });

  return (
    <lineSegments ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={gridLines.length / 3}
          array={gridLines}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color="#00ff41" transparent opacity={0.3} />
    </lineSegments>
  );
}

function FloatingParticles() {
  const particlesRef = useRef();
  const count = 500;

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 100;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 100;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 50;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position.array;
      for (let i = 0; i < count; i++) {
        positions[i * 3 + 1] += 0.02;
        if (positions[i * 3 + 1] > 50) {
          positions[i * 3 + 1] = -50;
        }
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.02;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.5}
        color="#00f5ff"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

function DataStream() {
  const streamRef = useRef();
  const count = 100;

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 80;
      pos[i * 3 + 1] = Math.random() * 100 - 50;
      pos[i * 3 + 2] = Math.random() * 20 - 30;
    }
    return pos;
  }, []);

  useFrame(() => {
    if (streamRef.current) {
      const positions = streamRef.current.geometry.attributes.position.array;
      for (let i = 0; i < count; i++) {
        positions[i * 3 + 1] -= 0.3;
        if (positions[i * 3 + 1] < -50) {
          positions[i * 3 + 1] = 50;
          positions[i * 3] = (Math.random() - 0.5) * 80;
        }
      }
      streamRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={streamRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={2}
        color="#00ff41"
        transparent
        opacity={0.8}
        sizeAttenuation
      />
    </points>
  );
}

function GlowingOrb() {
  const orbRef = useRef();

  useFrame((state) => {
    if (orbRef.current) {
      orbRef.current.position.y = Math.sin(state.clock.elapsedTime) * 5;
      orbRef.current.position.x = Math.cos(state.clock.elapsedTime * 0.5) * 10;
    }
  });

  return (
    <mesh ref={orbRef} position={[0, 0, -20]}>
      <sphereGeometry args={[2, 32, 32]} />
      <meshBasicMaterial color="#00ff41" transparent opacity={0.3} />
    </mesh>
  );
}

function CyberGrid3D() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 30], fov: 75 }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.5} />
        <Grid />
        <FloatingParticles />
        <DataStream />
        <GlowingOrb />
      </Canvas>
    </div>
  );
}

export default CyberGrid3D;
