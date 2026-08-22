import type { Tool, ToolInputSchema } from './tool.types.js';
import type { AgentCapability, AgentContext } from '../agent.types.js';
import { retrievalService } from '../../rag/retrieval.service.js';
import type { RetrievedChunk } from '../../rag/rag.types.js';

export interface KnowledgeSearchInput {
  query: string;
  fileIds?: string[];
  limit?: number;
}

export interface KnowledgeSearchChunk {
  chunkId: string;
  fileId: string;
  filename: string;
  content: string;
  score: number;
  scorePercent: number;
  page?: number | null;
  chunkIndex: number;
  sourceOrigin: string;
}

export interface KnowledgeSearchOutput {
  query: string;
  chunks: KnowledgeSearchChunk[];
  totalRetrieved: number;
  fileScopeRestricted: boolean;
}

export class KnowledgeSearchTool implements Tool<KnowledgeSearchInput, KnowledgeSearchOutput> {
  public readonly id = 'knowledge.search';
  public readonly name = 'Knowledge Base Search Tool';
  public readonly description =
    'Searches the authorized Knowledge Base documents and attached files using semantic RAG retrieval.';

  public readonly requiredCapabilities: AgentCapability[] = ['knowledge.read'];

  public readonly inputSchema: ToolInputSchema = {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query terms or topic to look up in Knowledge Base documents.',
      },
      fileIds: {
        type: 'array',
        description: 'Optional array of target file IDs to restrict search scope.',
      },
      limit: {
        type: 'number',
        description: 'Optional maximum number of chunks to return (default 8).',
      },
    },
    required: ['query'],
  };

  public async execute(input: KnowledgeSearchInput, context: AgentContext): Promise<KnowledgeSearchOutput> {
    if (!input || !input.query) {
      throw new Error('Knowledge search tool requires a "query" string parameter.');
    }

    const { userId, conversationId, messageFileIds = [] } = context;
    const limit = Math.min(input.limit || 8, 15);

    // STRICT FILE ISOLATION:
    // If current message has explicitly attached fileIds, search MUST be restricted strictly to messageFileIds
    let targetFileIds: string[] = [];
    let fileScopeRestricted = false;

    if (messageFileIds.length > 0) {
      targetFileIds = messageFileIds;
      fileScopeRestricted = true;
    } else if (input.fileIds && input.fileIds.length > 0) {
      targetFileIds = input.fileIds;
      fileScopeRestricted = true;
    }

    let retrievedChunks: RetrievedChunk[];
    if (fileScopeRestricted && targetFileIds.length > 0) {
      // Attached document mode: Retrieve full or relevant chunks from target files
      retrievedChunks = await retrievalService.retrieveAttachedDocuments(targetFileIds, userId);
      // Filter by query relevance if chunks exist
      if (retrievedChunks.length > limit) {
        retrievedChunks = await retrievalService.retrieveRelevantChunks(
          queryText(input.query),
          userId,
          conversationId || 'temp',
          { topK: limit, fileIds: targetFileIds }
        );
      }
    } else {
      // General RAG search across user's authorized files
      retrievedChunks = await retrievalService.retrieveRelevantChunks(
        input.query,
        userId,
        conversationId || 'temp',
        { topK: limit, fileIds: targetFileIds }
      );
    }

    const formattedChunks: KnowledgeSearchChunk[] = retrievedChunks.map((c: RetrievedChunk) => ({
      chunkId: c.chunkId,
      fileId: c.fileId,
      filename: c.filename,
      content: c.content,
      score: c.score,
      scorePercent: c.scorePercent,
      page: c.page,
      chunkIndex: c.chunkIndex,
      sourceOrigin: c.sourceOrigin || 'Knowledge Base',
    }));

    return {
      query: input.query,
      chunks: formattedChunks,
      totalRetrieved: formattedChunks.length,
      fileScopeRestricted,
    };
  }
}

function queryText(q: string): string {
  return q ? q.trim() : '';
}

export const knowledgeSearchTool = new KnowledgeSearchTool();
