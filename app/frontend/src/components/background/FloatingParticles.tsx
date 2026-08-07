import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface FloatingParticlesProps {
  count?: number;
}

interface ParticleData {
  id: number;
  size: number;
  x: number;
  startY: number;
  endY: number;
  duration: number;
  delay: number;
  opacity: number;
}

export const FloatingParticles: React.FC<FloatingParticlesProps> = React.memo(({ count = 28 }) => {
  const particles = useMemo<ParticleData[]>(() => {
    return Array.from({ length: count }, (_, i) => {
      const startY = Math.random() * 100 + 100; // start from 100% to 200% (below viewport or lower screen)
      const moveDistance = Math.random() * 120 + 80; // move 80% to 200% up
      return {
        id: i,
        size: Math.random() * 2.5 + 1.5, // 1.5px to 4px
        x: Math.random() * 100, // 0% to 100%
        startY: startY,
        endY: startY - moveDistance,
        duration: Math.random() * 15 + 12, // 12s to 27s
        delay: Math.random() * 10,
        opacity: Math.random() * 0.4 + 0.2, // 0.2 to 0.6
      };
    });
  }, [count]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{
            left: `${p.x}%`,
            top: `${p.startY}%`,
            opacity: 0,
          }}
          animate={{
            top: [`${p.startY}%`, `${p.endY}%`],
            opacity: [0, p.opacity, p.opacity, 0],
            x: [0, Math.sin(p.id) * 20, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: 'linear',
            delay: p.delay,
          }}
          style={{
            position: 'absolute',
            width: `${p.size}px`,
            height: `${p.size}px`,
          }}
          className="rounded-full bg-blue-300 shadow-[0_0_8px_rgba(96,165,250,0.9)]"
        />
      ))}
    </div>
  );
});

FloatingParticles.displayName = 'FloatingParticles';
