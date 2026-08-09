import React from 'react';
import { MessageBubble } from './MessageBubble';
import type { Message } from '../chat.types';

interface MessageGroupProps {
  messages: Message[];
}

export const MessageGroup: React.FC<MessageGroupProps> = ({ messages }) => {
  const latestUserMessageId = [...messages].reverse().find((m) => m.role === 'user')?.id;

  return (
    <div className="space-y-4 w-full max-w-4xl mx-auto">
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          isLatestUserMessage={message.id === latestUserMessageId}
        />
      ))}
    </div>
  );
};
