import React from 'react';
import { BlueGlowBlobs } from './BlueGlowBlobs';
import { PurpleGlowBlobs } from './PurpleGlowBlobs';
import { Stars } from './Stars';
import { OrbitLines } from './OrbitLines';
import { WaveLines } from './WaveLines';
import { FloatingParticles } from './FloatingParticles';

interface AnimatedBackgroundProps {
  children?: React.ReactNode;
  className?: string;
}

export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({
  children,
  className = '',
}) => {
  return (
    <div className={`relative min-h-screen w-full overflow-hidden bg-[#030712] ${className}`}>
      {/* Layer 1: Deep Radial Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#0B0F19] via-[#030712] to-[#02040A] pointer-events-none" />

      {/* Layer 2: Large Blurred Blue Glow Blobs */}
      <BlueGlowBlobs />

      {/* Layer 3: Purple Glow Blobs */}
      <PurpleGlowBlobs />

      {/* Layer 4: Random Stars */}
      <Stars count={60} />

      {/* Layer 5: SVG Orbital Circles */}
      <OrbitLines />

      {/* Layer 6: Animated Wave Lines */}
      <WaveLines />

      {/* Layer 7: Floating Particles */}
      <FloatingParticles count={30} />

      {/* Layer 8: Noise Texture (2% Opacity, Pure SVG Fractal Noise) */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none z-10 opacity-[0.02] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Foreground Content Container */}
      {children && <div className="relative z-20 w-full min-h-screen">{children}</div>}
    </div>
  );
};

export default AnimatedBackground;
