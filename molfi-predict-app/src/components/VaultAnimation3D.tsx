import { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { MeshDistortMaterial, Sphere, Float } from '@react-three/drei';
import * as THREE from 'three';

function AnimatedVault({ isHovered }: { isHovered: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [rotationSpeed, setRotationSpeed] = useState(0.5);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += isHovered ? 0.02 : 0.005;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <Float
      speed={2}
      rotationIntensity={isHovered ? 2 : 0.5}
      floatIntensity={isHovered ? 2 : 1}
    >
      <Sphere ref={meshRef} args={[1, 64, 64]} scale={isHovered ? 1.2 : 1}>
        <MeshDistortMaterial
          color={isHovered ? "#9b87f5" : "#7E69AB"}
          attach="material"
          distort={0.4}
          speed={isHovered ? 3 : 1.5}
          roughness={0.2}
          metalness={0.8}
          emissive={isHovered ? "#9b87f5" : "#7E69AB"}
          emissiveIntensity={isHovered ? 0.5 : 0.2}
        />
      </Sphere>
      
      {/* Glow effect */}
      <Sphere args={[1.3, 32, 32]} scale={isHovered ? 1.2 : 1}>
        <meshBasicMaterial
          color="#9b87f5"
          transparent
          opacity={isHovered ? 0.2 : 0.1}
          side={THREE.BackSide}
        />
      </Sphere>
    </Float>
  );
}

export function VaultAnimation3D() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="w-full h-64 cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Canvas camera={{ position: [0, 0, 3], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#9b87f5" />
        <AnimatedVault isHovered={isHovered} />
      </Canvas>
    </div>
  );
}
