import type { AttachedFile } from '../files/types/files.types';

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

export interface MessageCitation {
  fileId: string;
  filename: string;
  page?: number | null;
  chunkId: string;
  chunkIndex: number;
  score: number;
  scorePercent: number;
  excerpt: string;
  sourceOrigin?: 'Message Attachment' | 'Conversation Context';
}

export type MemoryType = 'summary' | 'preference' | 'fact' | 'decision' | 'goal';

export type WorkspaceMemoryType = 'fact' | 'preference' | 'decision' | 'goal';

export interface WorkspaceMemory {
  id: string;
  userId: string;
  content: string;
  type: WorkspaceMemoryType;
  importance: number;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationMemory {
  id: string;
  conversationId: string;
  content: string;
  type: MemoryType;
  importance: number;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AgentExecutionTraceStep {
  step: string;
  timestamp: string;
  durationMs?: number;
  details?: Record<string, unknown>;
}

export interface AgentExecutionMeta {
  agentId: string;
  agentName: string;
  routingReason: string;
  durationMs: number;
  traceSteps: AgentExecutionTraceStep[];
}

export interface ContextStrategyMeta {
  strategy: 'conversation' | 'attached-document' | 'large-document' | 'hybrid';
  messageFileIds: string[];
  conversationFileIds: string[];
  totalChunksAvailable: number;
  chunksInjected: number;
  tokensBudget: number;
  tokensUsed: number;
  compressionApplied: boolean;
  semanticSearchEnabled: boolean;
  previousContextUsed: boolean;
  previousContextReason: string;
  filesLoaded: Array<{ fileId: string; filename: string; chunkCount: number }>;
  memoriesInjectedCount?: number;
  memoriesInjected?: Array<{ id: string; content: string; type: string; isPinned: boolean; scope?: 'conversation' | 'workspace' }>;
  agentMeta?: AgentExecutionMeta;
}

export interface MessageMetadata {
  citations?: MessageCitation[];
  retrievedChunksCount?: number;
  retrievedTokensCount?: number;
  hasRAGContext?: boolean;
  strategyMeta?: ContextStrategyMeta;
  [key: string]: unknown;
}

export interface MessageAttachment {
  id: string;
  fileId: string;
  source?: string;
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

export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  metadata?: MessageMetadata | Record<string, unknown> | null;
  attachments?: MessageAttachment[];
  createdAt: string;
}

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
  sendMessage: (content: string, fileIds?: string[], attachmentSources?: Record<string, string>, filesMeta?: Array<{fileId: string; filename: string; extension: string}>) => Promise<void>;
  cancelGeneration: () => void;
  refreshConversations: () => Promise<void>;
  clearGenerationError: () => void;

  uploadAndAttachFile: (file: File, onProgress?: (progress: number) => void) => Promise<{ attached: boolean; isDuplicate?: boolean; message?: string; fileId?: string } | null>;
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
