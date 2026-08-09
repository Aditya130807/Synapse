import type { ContextStrategyMeta } from '../context/context.strategy.js';

export interface RetrievedChunk {
  id: string;
  chunkId: string;
  fileId: string;
  filename: string;
  page?: number | null;
  chunkIndex: number;
  score: number;
  scorePercent: number;
  content: string;
  tokenEstimate?: number;
  sourceOrigin?: 'Message Attachment' | 'Conversation Context';
}

export interface Citation {
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

export interface RAGContext {
  chunks: RetrievedChunk[];
  formattedContextText: string;
  totalTokens: number;
  citations: Citation[];
  strategyMeta?: ContextStrategyMeta;
}

export interface RAGPromptResult {
  systemPrompt: string;
  userPrompt: string;
  context: RAGContext;
}
