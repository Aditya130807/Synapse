import React, { useRef, useEffect } from 'react';
import { useChat } from '../context/chatContext';
import { MessageGroup } from './MessageGroup';
import { TypingIndicator } from './TypingIndicator';

export const MessageList: React.FC = () => {
  const { currentMessages, isLoadingMessages, isGenerating, isStreaming } = useChat();
  const bottomRef = useRef<HTMLDivElement>(null);

  const lastMessage = currentMessages[currentMessages.length - 1];
  const isWaitingForFirstToken =
    isGenerating &&
    Boolean(lastMessage) &&
    lastMessage?.role === 'assistant' &&
    lastMessage?.content === '';

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages, isGenerating, isStreaming]);

  if (isLoadingMessages) {
    return (
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 max-w-4xl mx-auto w-full select-none">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-start gap-3 p-4 rounded-2xl border border-white/[0.04] bg-[#020617]/50 shadow-inner animate-pulse"
          >
            <div className="h-8 w-8 rounded-xl bg-white/10 shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-3.5 w-24 rounded bg-white/10" />
              <div className="h-4 w-5/6 rounded bg-white/5" />
              <div className="h-4 w-2/3 rounded bg-white/5" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 w-full">
      <MessageGroup messages={currentMessages} />

      {/* Typing Indicator while waiting for the first token */}
      {isWaitingForFirstToken && <TypingIndicator />}

      <div ref={bottomRef} className="h-1" />
    </div>
  );
};
