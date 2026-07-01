import { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Html, Line } from "@react-three/drei";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";

interface VenueStats {
  status: string;
}

interface VenueNodeProps {
  position: [number, number, number];
  color: string;
  name: string;
  stats: VenueStats;
  onClick: () => void;
  isExpanded: boolean;
}

const VenueNode = ({ position, color, name, stats, onClick, isExpanded }: VenueNodeProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
      const scale = isExpanded ? 1.3 : (hovered ? 1.15 : 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1);
      meshRef.current.scale.setScalar(scale);
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <group position={position}>
        <mesh 
          ref={meshRef}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          <sphereGeometry args={[0.5, 32, 32]} />
          <meshStandardMaterial 
            color={color} 
            emissive={color} 
            emissiveIntensity={isExpanded ? 0.8 : hovered ? 0.6 : 0.5}
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
        
        <mesh scale={isExpanded ? 1.6 : hovered ? 1.4 : 1.3}>
          <sphereGeometry args={[0.5, 32, 32]} />
          <meshBasicMaterial 
            color={color} 
            transparent 
            opacity={isExpanded ? 0.4 : hovered ? 0.3 : 0.2}
          />
        </mesh>

        <Html distanceFactor={10} position={[0, -1, 0]}>
          <motion.div
            animate={{
              scale: isExpanded ? 1.1 : 1,
            }}
            className={`bg-card/90 backdrop-blur-sm border border-border rounded-lg p-2 text-center transition-all cursor-pointer hover:bg-card min-w-[120px]`}
            onClick={onClick}
          >
            <div className="font-bold text-sm text-foreground">{name}</div>
            <div className="text-xs text-muted-foreground">{stats.status}</div>
          </motion.div>
        </Html>
      </group>
    </Float>
  );
};

const FlowingParticles = ({ start, end, color }: { start: [number, number, number]; end: [number, number, number]; color: string }) => {
  const particlesRef = useRef<THREE.Points>(null);
  
  useFrame((state) => {
    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
      const time = state.clock.elapsedTime;
      
      for (let i = 0; i < positions.length; i += 3) {
        const t = (time * 0.3 + i / positions.length) % 1;
        positions[i] = start[0] + (end[0] - start[0]) * t;
        positions[i + 1] = start[1] + (end[1] - start[1]) * t;
        positions[i + 2] = start[2] + (end[2] - start[2]) * t;
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  const particleCount = 20;
  const positions = new Float32Array(particleCount * 3);
  
  for (let i = 0; i < particleCount; i++) {
    const t = i / particleCount;
    positions[i * 3] = start[0] + (end[0] - start[0]) * t;
    positions[i * 3 + 1] = start[1] + (end[1] - start[1]) * t;
    positions[i * 3 + 2] = start[2] + (end[2] - start[2]) * t;
  }

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.1} color={color} transparent opacity={0.6} />
    </points>
  );
};

const ConnectionLine = ({ start, end, color }: { start: [number, number, number]; end: [number, number, number]; color: string }) => {
  return (
    <Line
      points={[start, end]}
      color={color}
      lineWidth={2}
      transparent
      opacity={0.3}
      dashed
      dashScale={50}
      dashSize={1}
      gapSize={0.5}
    />
  );
};

const Scene = ({ expandedVenue, onVenueClick }: { expandedVenue: string | null; onVenueClick: (name: string) => void }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.3;
    }
  });

  const venues = [
    { 
      position: [-3, 1, 0] as [number, number, number], 
      color: "#3b82f6", 
      name: "Polymarket",
      stats: { status: "Live" }
    },
    { 
      position: [3, 1, 0] as [number, number, number], 
      color: "#10b981", 
      name: "Limitless",
      stats: { status: "Live" }
    },
    { 
      position: [0, -1.5, 1] as [number, number, number], 
      color: "#8b5cf6", 
      name: "Kalshi",
      stats: { status: "Live" }
    },
    { 
      position: [0, 2.5, -1] as [number, number, number], 
      color: "url(#gradient)", 
      name: "Molfi Hub",
      stats: { status: "Coming Soon" }
    },
  ];

  return (
    <group ref={groupRef}>
      {/* Render nodes */}
      {venues.map((venue, i) => (
        <VenueNode 
          key={i} 
          {...venue} 
          onClick={() => onVenueClick(venue.name)}
          isExpanded={expandedVenue === venue.name}
        />
      ))}

      {/* Render connections and flowing particles */}
      {venues.slice(0, 3).map((venue, i) => (
        <group key={i}>
          <ConnectionLine 
            start={venue.position} 
            end={venues[3].position} 
            color={venue.color}
          />
          <FlowingParticles 
            start={venue.position} 
            end={venues[3].position} 
            color={venue.color}
          />
        </group>
      ))}

      {/* Ambient light */}
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#8b5cf6" />
    </group>
  );
};

export const LiquidityNetwork3D = () => {
  const [expandedVenue, setExpandedVenue] = useState<string | null>(null);

  const handleVenueClick = (venueName: string) => {
    setExpandedVenue(expandedVenue === venueName ? null : venueName);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
      className="w-full h-[600px] rounded-xl overflow-hidden bg-card/30 backdrop-blur-sm border border-border"
    >
      <div className="relative w-full h-full">
        <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
          <Scene expandedVenue={expandedVenue} onVenueClick={handleVenueClick} />
        </Canvas>
        
        <div className="absolute top-4 left-4 bg-card/90 backdrop-blur-sm border border-border rounded-lg p-3">
          <h3 className="font-bold text-foreground mb-1">Unified Liquidity Network</h3>
          <p className="text-xs text-muted-foreground">Click venue nodes to view real-time stats</p>
        </div>
      </div>
    </motion.div>
  );
};
