import React from 'react';
import { motion } from 'framer-motion';

export const PurpleGlowBlobs: React.FC = React.memo(() => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Top Left Deep Purple / Indigo Blob */}
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.22, 0.32, 0.22],
          x: [0, 20, 0],
          y: [0, -15, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 2,
        }}
        className="absolute -top-32 -left-32 w-[580px] h-[580px] rounded-full bg-gradient-to-br from-purple-700/30 via-indigo-800/20 to-transparent blur-[150px]"
      />

      {/* Middle Right Purple Glow Accent */}
      <motion.div
        animate={{
          opacity: [0.12, 0.22, 0.12],
          y: [0, -25, 0],
        }}
        transition={{
          duration: 24,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1,
        }}
        className="absolute top-1/2 -right-36 -translate-y-1/2 w-[480px] h-[600px] rounded-full bg-gradient-to-l from-purple-600/25 via-fuchsia-900/15 to-transparent blur-[140px]"
      />
    </div>
  );
});

PurpleGlowBlobs.displayName = 'PurpleGlowBlobs';
