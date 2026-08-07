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
    <div className="flex items-center gap-3 py-3 px-4 max-w-3xl mx-auto opacity-95 animate-in fade-in duration-200">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-blue-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]">
        <Sparkles className="h-4 w-4 animate-spin text-white" />
      </div>
      <div className="flex items-center gap-2.5 rounded-2xl bg-[rgba(15,23,42,0.85)] border border-[rgba(255,255,255,0.08)] px-4 py-2.5 shadow-xl backdrop-blur-xl">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#3B82F6] animate-bounce [animation-delay:-0.3s]" />
          <span className="h-2 w-2 rounded-full bg-[#3B82F6] animate-bounce [animation-delay:-0.15s]" />
          <span className="h-2 w-2 rounded-full bg-[#3B82F6] animate-bounce" />
        </div>
        <div className="flex items-center gap-1.5 border-l border-white/10 pl-2.5 text-xs text-slate-300 font-medium">
          <Cpu className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
          <span>Thinking...</span>
          <span className="font-mono text-[11px] text-blue-400 font-normal">{formattedSeconds}s</span>
        </div>
      </div>
    </div>
  );
};
