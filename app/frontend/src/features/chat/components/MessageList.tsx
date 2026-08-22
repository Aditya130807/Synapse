import React, { useRef, useEffect } from 'react';
import { useChat } from '../context/chatContext';
import { MessageGroup } from './MessageGroup';

export const MessageList: React.FC = () => {
  const { currentMessages, isLoadingMessages, isGenerating, isStreaming } = useChat();
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages, isGenerating, isStreaming]);

  if (isLoadingMessages) {
    return (
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 max-w-4xl mx-auto w-full select-none bg-background">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-start gap-3 p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xs animate-pulse"
          >
            <div className="h-8 w-8 rounded-xl bg-[var(--skeleton)] shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-3.5 w-24 rounded bg-[var(--skeleton)]" />
              <div className="h-4 w-5/6 rounded bg-[var(--skeleton)]" />
              <div className="h-4 w-2/3 rounded bg-[var(--skeleton)]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 w-full bg-background">
      <MessageGroup messages={currentMessages} />
      <div ref={bottomRef} className="h-1" />
    </div>
  );
};
