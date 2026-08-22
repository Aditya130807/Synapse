import React from 'react';

interface AnimatedBackgroundProps {
  children?: React.ReactNode;
  className?: string;
}

export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({
  children,
  className = '',
}) => {
  return (
    <div
      className={`relative min-h-screen w-full overflow-hidden transition-colors duration-200 ${className}`}
      style={{ backgroundColor: 'var(--background)' }}
    >
      {/* Layer 1: Very subtle radial ambient highlight */}
      <div
        className="ambient-glow pointer-events-none absolute inset-0 opacity-40"
        style={{
          background: 'radial-gradient(circle at 45% 35%, rgba(166, 214, 58, 0.04) 0%, transparent 60%)',
        }}
      />

      {/* Layer 2: Ultra-subtle Developer Dot Grid Pattern */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage: `radial-gradient(var(--border) 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Layer 3: Faint SVG Orbital Ring Lines for understated depth */}
      <div className="ambient-glow pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.06]">
        <svg className="w-[1000px] h-[1000px]" viewBox="0 0 1000 1000" fill="none">
          <circle cx="500" cy="500" r="420" stroke="var(--primary)" strokeWidth="1" strokeDasharray="6 8" />
          <circle cx="500" cy="500" r="300" stroke="var(--border-strong)" strokeWidth="1" />
        </svg>
      </div>

      {/* Foreground Content */}
      {children && <div className="relative z-20 w-full min-h-screen">{children}</div>}
    </div>
  );
};

export default AnimatedBackground;
