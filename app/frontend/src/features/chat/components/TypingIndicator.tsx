import React, { useState, useEffect } from 'react';
import { Sparkles, Cpu } from 'lucide-react';

export const TypingIndicator: React.FC = () => {
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const timer = setInterval(() => {
      setElapsedMs(Date.now() - startTime);
    }, 100);

    return () => clearInterval(timer);
  }, []);

  const formattedSeconds = (elapsedMs / 1000).toFixed(1);

  return (
    <div className="flex items-center gap-3 py-3 px-4 max-w-3xl mx-auto animate-in fade-in duration-200">
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl font-bold text-xs shadow-xs border"
        style={{
          backgroundColor: 'var(--primary-muted)',
          borderColor: 'var(--primary-border)',
          color: 'var(--primary)',
        }}
      >
        <Sparkles className="h-4 w-4 animate-spin" style={{ color: 'var(--primary)' }} />
      </div>
      <div className="flex items-center gap-2.5 rounded-2xl border px-4 py-2.5 shadow-xs backdrop-blur-xl" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full animate-bounce [animation-delay:-0.3s]" style={{ backgroundColor: 'var(--primary)' }} />
          <span className="h-2 w-2 rounded-full animate-bounce [animation-delay:-0.15s]" style={{ backgroundColor: 'var(--primary)' }} />
          <span className="h-2 w-2 rounded-full animate-bounce" style={{ backgroundColor: 'var(--primary)' }} />
        </div>
        <div className="flex items-center gap-1.5 border-l pl-2.5 text-xs font-medium" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
          <Cpu className="h-3.5 w-3.5 animate-pulse" style={{ color: 'var(--primary)' }} />
          <span>Thinking...</span>
          <span className="font-mono text-[11px] font-normal" style={{ color: 'var(--primary)' }}>{formattedSeconds}s</span>
        </div>
      </div>
    </div>
  );
};
