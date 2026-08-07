import React from 'react';
import { motion } from 'framer-motion';

export const GlowBlobs: React.FC = React.memo(() => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Top Left Blob - Deep Indigo */}
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.25, 0.35, 0.25],
          x: [0, 20, 0],
          y: [0, -15, 0],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute -top-32 -left-32 w-[550px] h-[550px] rounded-full bg-gradient-to-br from-indigo-600/40 via-blue-700/20 to-transparent blur-[140px]"
      />

      {/* Top Right Blob - Electric Blue */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.2, 0.3, 0.2],
          x: [0, -25, 0],
          y: [0, 20, 0],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 2,
        }}
        className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-gradient-to-bl from-blue-600/35 via-cyan-600/15 to-transparent blur-[160px]"
      />

      {/* Center Bottom Ambient Glow */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.15, 0.25, 0.15],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 4,
        }}
        className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/3 w-[900px] h-[500px] rounded-full bg-gradient-to-t from-blue-600/30 via-indigo-900/20 to-transparent blur-[160px]"
      />

      {/* Subtle Right Side Accent */}
      <motion.div
        animate={{
          opacity: [0.1, 0.2, 0.1],
          y: [0, -30, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1,
        }}
        className="absolute top-1/2 -right-40 -translate-y-1/2 w-[450px] h-[650px] rounded-full bg-gradient-to-l from-blue-500/20 via-indigo-600/10 to-transparent blur-[130px]"
      />
    </div>
  );
});

GlowBlobs.displayName = 'GlowBlobs';
