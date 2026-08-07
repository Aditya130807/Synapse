export type MessageRole = 'user' | 'assistant' | 'system';
export type ConversationStatus = 'active' | 'archived';

export interface Conversation {
  id: string;
  title: string;
  status: ConversationStatus;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

import type { AttachedFile } from '../files/types/files.types';

export interface ChatContextType {
  conversations: Conversation[];
  selectedConversationId: string | null;
  selectedConversation: Conversation | null;
  messages: Record<string, Message[]>;
  currentMessages: Message[];
  attachedFiles: AttachedFile[];
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  isLoadingAttachedFiles: boolean;
  isSendingMessage: boolean;
  isGenerating: boolean;
  isStreaming: boolean;
  generationError: string | null;

  selectConversation: (id: string | null) => void;
  createNewConversation: (title?: string) => Promise<Conversation | null>;
  renameConversation: (id: string, title: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  cancelGeneration: () => void;
  refreshConversations: () => Promise<void>;
  clearGenerationError: () => void;

  uploadAndAttachFile: (file: File, onProgress?: (progress: number) => void) => Promise<{ attached: boolean; isDuplicate?: boolean; message?: string } | null>;
  attachExistingFile: (fileId: string) => Promise<boolean>;
  detachFile: (fileId: string) => Promise<boolean>;

  updateMessage: (
    messageId: string,
    updates: { content?: string; metadata?: Record<string, unknown> },
  ) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  regenerateResponse: () => Promise<void>;
  editUserMessageAndSubmit: (messageId: string, newContent: string) => Promise<void>;
}

