import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  type: 'star' | 'sparkle' | 'circle';
}

interface ParticleEffectsProps {
  isActive?: boolean;
}

export function ParticleEffects({ isActive = true }: ParticleEffectsProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Generate initial particles
    const initialParticles: Particle[] = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 8 + 4,
      delay: Math.random() * 2,
      duration: Math.random() * 3 + 2,
      type: ['star', 'sparkle', 'circle'][Math.floor(Math.random() * 3)] as 'star' | 'sparkle' | 'circle'
    }));
    setParticles(initialParticles);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setMousePosition({ x, y });
  };

  const getParticleStyle = (particle: Particle) => {
    const distanceX = particle.x - mousePosition.x;
    const distanceY = particle.y - mousePosition.y;
    const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
    
    // Particles move away from cursor
    const force = Math.max(0, 30 - distance) / 30;
    const offsetX = distanceX * force * 2;
    const offsetY = distanceY * force * 2;

    return {
      left: `${particle.x + offsetX}%`,
      top: `${particle.y + offsetY}%`,
    };
  };

  const renderParticle = (particle: Particle) => {
    switch (particle.type) {
      case 'star':
        return (
          <svg width={particle.size} height={particle.size} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        );
      case 'sparkle':
        return (
          <svg width={particle.size} height={particle.size} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0l2 7h7l-5.5 4.5L17 19l-5-4-5 4 1.5-7.5L3 7h7z" />
          </svg>
        );
      case 'circle':
        return (
          <div 
            className="rounded-full bg-current" 
            style={{ width: particle.size, height: particle.size }}
          />
        );
    }
  };

  if (!isActive) return null;

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 pointer-events-none overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute text-primary/30"
          style={getParticleStyle(particle)}
          animate={{
            opacity: [0.3, 0.8, 0.3],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: "easeInOut"
          }}
        >
          {renderParticle(particle)}
        </motion.div>
      ))}
    </div>
  );
}
