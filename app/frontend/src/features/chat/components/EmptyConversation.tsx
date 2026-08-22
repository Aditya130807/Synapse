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
    <div className="relative flex h-full w-full flex-col items-center justify-center p-6 text-center select-none animate-in fade-in duration-300 overflow-hidden bg-[var(--background)]">
      <div className="relative z-10 flex flex-col items-center justify-center max-w-xl space-y-6">
        {/* Glow Badge Icon */}
        <div
          className="relative flex h-16 w-16 items-center justify-center rounded-2xl border shadow-sm"
          style={{
            backgroundColor: 'var(--primary-muted)',
            borderColor: 'var(--primary-border)',
            color: 'var(--primary)',
          }}
        >
          <Sparkles className="h-8 w-8" style={{ color: 'var(--primary)' }} />
        </div>

        {/* Welcome Headlines */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            Welcome to <span style={{ color: 'var(--primary)' }}>Synapse AI</span>
          </h1>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-md">
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
                className="group flex items-center gap-3.5 p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary)] hover:bg-[var(--surface-elevated)] transition-all duration-200 cursor-pointer text-left shadow-xs hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
              >
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border group-hover:scale-105 transition-transform"
                  style={{
                    backgroundColor: 'var(--surface-elevated)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--primary)',
                  }}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-xs font-semibold text-[var(--text-primary)] transition-colors">
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
