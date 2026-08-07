import type { MessageRole, ConversationStatus } from '@prisma/client';

export { MessageRole, ConversationStatus };

export interface ConversationDTO {
  id: string;
  title: string;
  status: ConversationStatus;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageDTO {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
}

export interface CreateConversationBody {
  title?: string;
}

export interface UpdateConversationBody {
  title?: string;
  status?: ConversationStatus;
}

export interface CreateMessageBody {
  role: MessageRole;
  content: string;
  metadata?: Record<string, unknown>;
}

export interface GetMessagesQuery {
  cursor?: string;
  limit?: number;
}
