import React from 'react';
import { motion } from 'framer-motion';

export const OrbitLines: React.FC = React.memo(() => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Top-Left Large Orbital Arc */}
      <motion.div
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 180,
          repeat: Infinity,
          ease: 'linear',
        }}
        className="absolute -top-[300px] -left-[300px] w-[900px] h-[900px] rounded-full border border-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.03)]"
      />

      {/* Concentric Inner Arc Top-Left */}
      <motion.div
        animate={{
          rotate: -360,
        }}
        transition={{
          duration: 240,
          repeat: Infinity,
          ease: 'linear',
        }}
        className="absolute -top-[200px] -left-[200px] w-[650px] h-[650px] rounded-full border border-indigo-400/10"
      />

      {/* Bottom-Right Orbital Arc */}
      <motion.div
        animate={{
          rotate: -360,
        }}
        transition={{
          duration: 210,
          repeat: Infinity,
          ease: 'linear',
        }}
        className="absolute -bottom-[400px] -right-[400px] w-[1100px] h-[1100px] rounded-full border border-cyan-500/10 shadow-[0_0_20px_rgba(6,182,212,0.02)]"
      />

      {/* Middle Floating Accent Ring */}
      <motion.div
        animate={{
          scale: [1, 1.04, 1],
          opacity: [0.08, 0.14, 0.08],
        }}
        transition={{
          duration: 16,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[750px] rounded-full border border-blue-400/10"
      />
    </div>
  );
});

OrbitLines.displayName = 'OrbitLines';
