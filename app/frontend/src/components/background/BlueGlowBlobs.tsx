import React from 'react';
import { motion } from 'framer-motion';

export const BlueGlowBlobs: React.FC = React.memo(() => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Top Right Blue Glow Blob */}
      <motion.div
        animate={{
          scale: [1, 1.12, 1],
          opacity: [0.2, 0.3, 0.2],
          x: [0, -25, 0],
          y: [0, 20, 0],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute -top-40 -right-40 w-[650px] h-[650px] rounded-full bg-gradient-to-bl from-blue-600/30 via-cyan-600/15 to-transparent blur-[160px]"
      />

      {/* Bottom Center Blue Ambient Blob */}
      <motion.div
        animate={{
          scale: [1, 1.18, 1],
          opacity: [0.15, 0.25, 0.15],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 4,
        }}
        className="absolute bottom-0 left-1/3 translate-y-1/4 w-[850px] h-[480px] rounded-full bg-gradient-to-t from-blue-600/25 via-indigo-900/15 to-transparent blur-[160px]"
      />
    </div>
  );
});

BlueGlowBlobs.displayName = 'BlueGlowBlobs';
