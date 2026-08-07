import React from 'react';
import { Sparkles, Code, FileText, Lightbulb, ListOrdered } from 'lucide-react';
import { useChat } from '../context/chatContext';

export const EmptyConversation: React.FC = () => {
  const { sendMessage } = useChat();

  const suggestionCards = [
    {
      icon: Code,
      title: 'Explain this code',
      prompt: 'Explain this code and break down its step-by-step logic and complexity.',
    },
    {
      icon: FileText,
      title: 'Analyze this document',
      prompt: 'Analyze this document and extract key architectural recommendations.',
    },
    {
      icon: Lightbulb,
      title: 'Help me brainstorm',
      prompt: 'Help me brainstorm innovative features for a developer-focused AI workspace.',
    },
    {
      icon: ListOrdered,
      title: 'Summarize this content',
      prompt: 'Summarize this content into actionable bullet points for the team.',
    },
  ];

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center p-6 text-center select-none animate-in fade-in duration-300 overflow-hidden">
      {/* Subtle Ambient Radial Light Bleed Background */}
      <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[350px] w-[450px] rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.12)_0%,transparent_70%)] blur-[80px]" />

      <div className="relative z-10 flex flex-col items-center justify-center max-w-xl space-y-6">
        {/* Glow Badge Icon */}
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#3B82F6]/30 via-indigo-500/20 to-[#2563EB]/15 text-[#3B82F6] border border-[#3B82F6]/40 shadow-[0_0_35px_rgba(59,130,246,0.3)] animate-pulse">
          <Sparkles className="h-8 w-8 text-[#3B82F6]" />
        </div>

        {/* Welcome Headlines */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-[#F8FAFC]">
            Welcome to <span className="text-[#3B82F6]">Synapse AI</span>
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed max-w-md">
            Your AI workspace for intelligence, context analysis, and developer workflows.
          </p>
        </div>

        {/* 2x2 Suggestion Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 w-full max-w-lg">
          {suggestionCards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.title}
                onClick={() => sendMessage(card.prompt)}
                className="group flex items-center gap-3.5 p-4 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#0A0F1D]/80 hover:border-[#3B82F6]/60 hover:bg-white/[0.05] transition-all duration-200 cursor-pointer text-left shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.18)] hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/25 group-hover:scale-105 transition-transform">
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-xs font-semibold text-slate-100 group-hover:text-white transition-colors">
                  {card.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
