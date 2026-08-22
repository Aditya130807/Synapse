import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import { useChat } from '../context/chatContext';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { EmptyConversation } from './EmptyConversation';
import { MessageComposer } from './MessageComposer';

export const ConversationWorkspace: React.FC = () => {
  const { selectedConversation, currentMessages, generationError, clearGenerationError } = useChat();

  const hasActiveConversation = Boolean(selectedConversation);
  const hasMessages = currentMessages.length > 0;

  return (
    <div className="flex h-full w-full flex-col bg-background text-foreground relative overflow-hidden">
      {/* Top Bar Header */}
      <ChatHeader />

      {/* Generation Error Banner */}
      {generationError && (
        <div className="mx-4 mt-2 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300 shrink-0">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-red-400" />
          <span className="flex-1">{generationError}</span>
          <button
            onClick={clearGenerationError}
            className="shrink-0 text-red-400/70 hover:text-red-300 transition-colors"
            title="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Main Viewport: MessageList vs EmptyConversation */}
      <div className="flex-1 overflow-hidden flex flex-col relative bg-background">
        {hasActiveConversation && hasMessages ? (
          <MessageList />
        ) : (
          <EmptyConversation />
        )}
      </div>

      {/* Fixed Bottom Prompt Input */}
      <MessageComposer />
    </div>
  );
};
