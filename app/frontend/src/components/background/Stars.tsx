import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface StarProps {
  count?: number;
}

interface StarData {
  id: number;
  size: number;
  x: number;
  y: number;
  initialOpacity: number;
  duration: number;
  delay: number;
}

export const Stars: React.FC<StarProps> = React.memo(({ count = 55 }) => {
  const stars = useMemo<StarData[]>(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      size: Math.random() * 2 + 1, // 1px to 3px
      x: Math.random() * 100, // 0% to 100%
      y: Math.random() * 100, // 0% to 100%
      initialOpacity: Math.random() * 0.5 + 0.25, // 0.25 to 0.75
      duration: Math.random() * 4 + 3, // 3s to 7s
      delay: Math.random() * 5, // 0s to 5s
    }));
  }, [count]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {stars.map((star) => (
        <motion.div
          key={star.id}
          initial={{ opacity: star.initialOpacity, scale: 1 }}
          animate={{
            opacity: [star.initialOpacity, star.initialOpacity * 0.2, star.initialOpacity * 1.2, star.initialOpacity],
            scale: [1, 0.8, 1.2, 1],
          }}
          transition={{
            duration: star.duration,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: star.delay,
          }}
          style={{
            position: 'absolute',
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
          }}
          className="rounded-full bg-blue-100 shadow-[0_0_6px_rgba(147,197,253,0.8)]"
        />
      ))}
    </div>
  );
});

Stars.displayName = 'Stars';
