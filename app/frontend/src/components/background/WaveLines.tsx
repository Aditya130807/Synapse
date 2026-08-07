import React from 'react';
import { motion } from 'framer-motion';

export const WaveLines: React.FC = React.memo(() => {
  return (
    <div className="absolute inset-x-0 bottom-0 h-[450px] overflow-hidden pointer-events-none opacity-40">
      <svg
        className="w-full h-full"
        viewBox="0 0 1440 450"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="wave-gradient-1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.05" />
            <stop offset="50%" stopColor="#60A5FA" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#1E40AF" stopOpacity="0.05" />
          </linearGradient>
          <linearGradient id="wave-gradient-2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366F1" stopOpacity="0.02" />
            <stop offset="50%" stopColor="#3B82F6" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Primary Ethereal Wave Path */}
        <motion.path
          d="M-200,320 C150,220 450,420 800,280 C1150,140 1450,340 1800,260"
          stroke="url(#wave-gradient-1)"
          strokeWidth="1.5"
          fill="none"
          animate={{
            x: [-60, 60, -60],
            d: [
              "M-200,320 C150,220 450,420 800,280 C1150,140 1450,340 1800,260",
              "M-200,300 C150,250 450,390 800,260 C1150,170 1450,310 1800,280",
              "M-200,320 C150,220 450,420 800,280 C1150,140 1450,340 1800,260",
            ],
          }}
          transition={{
            duration: 24,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Secondary Intertwined Wave Path */}
        <motion.path
          d="M-200,380 C200,290 500,410 850,310 C1200,210 1500,360 1800,300"
          stroke="url(#wave-gradient-2)"
          strokeWidth="1.2"
          fill="none"
          animate={{
            x: [40, -40, 40],
            d: [
              "M-200,380 C200,290 500,410 850,310 C1200,210 1500,360 1800,300",
              "M-200,360 C200,320 500,380 850,290 C1200,230 1500,380 1800,320",
              "M-200,380 C200,290 500,410 850,310 C1200,210 1500,360 1800,300",
            ],
          }}
          transition={{
            duration: 28,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />

        {/* Subtle Ambient Under-Wave */}
        <motion.path
          d="M-200,410 C100,350 400,430 750,360 C1100,290 1400,400 1800,350"
          stroke="#3B82F6"
          strokeOpacity="0.08"
          strokeWidth="1"
          fill="none"
          animate={{
            x: [-30, 30, -30],
          }}
          transition={{
            duration: 32,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </svg>
    </div>
  );
});

WaveLines.displayName = 'WaveLines';
