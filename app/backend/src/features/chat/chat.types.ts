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

export interface MessageAttachmentDTO {
  id: string;
  fileId: string;
  source: string;
  file: {
    id: string;
    filename: string;
    originalName: string;
    extension: string;
    mimeType: string;
    size: number;
    status: string;
  };
}

export interface MessageDTO {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  metadata?: Record<string, unknown> | null;
  attachments?: MessageAttachmentDTO[];
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
  fileIds?: string[];
  attachmentSources?: Record<string, string>;
}

export interface GetMessagesQuery {
  cursor?: string;
  limit?: number;
}
