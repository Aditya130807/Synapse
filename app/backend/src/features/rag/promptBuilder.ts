import type { RAGContext } from './rag.types.js';

export class PromptBuilder {
  /**
   * Constructs RAG System Prompt and augmented User Query.
   */
  static buildRAGPrompt(
    userQuery: string,
    ragContext: RAGContext,
    memoriesText?: string
  ): { systemPrompt: string; augmentedUserQuery: string } {
    const strategy = ragContext.strategyMeta?.strategy || 'conversation';
    const memoryBlock = memoriesText ? `\n\nACTIVE MEMORIES:\nThe following workspace-level and conversation-level facts, preferences, decisions, and goals are relevant:\n${memoriesText}` : '';

    if (!ragContext.formattedContextText || ragContext.chunks.length === 0) {
      const fallbackSystemPrompt =
        `You are Synapse AI, an intelligent AI workspace assistant. Respond accurately, clearly, and concisely using Markdown formatting.${memoryBlock}`;

      return {
        systemPrompt: fallbackSystemPrompt,
        augmentedUserQuery: userQuery,
      };
    }

    let headerNotice = 'The user has uploaded knowledge documents. Relevant excerpts from these documents have been retrieved for you below.';

    if (strategy === 'attached-document') {
      const filesStr = ragContext.strategyMeta?.filesLoaded
        .map((f) => `${f.filename} (${f.chunkCount} chunks)`)
        .join(', ') || 'Attached Document';
      headerNotice = `ATTACHED DOCUMENT MODE (AUTHORITATIVE CONTEXT):
The user explicitly attached: ${filesStr}.
The FULL document content has been loaded below into your context window.
IMPORTANT: Treat these attached documents as the primary, authoritative source of truth for this prompt. Do NOT ask clarification questions if the answer is present in these documents.`;
    } else if (strategy === 'large-document') {
      headerNotice = `LARGE DOCUMENT MODE (HIERARCHICAL COMPRESSION APPLIED):
The user attached large document(s) exceeding standard token limits. A structured hierarchical summary covering key sections is provided below. Analyze all available sections thoroughly.`;
    } else if (strategy === 'hybrid') {
      headerNotice = `HYBRID MODE (ATTACHED DOCUMENTS + KNOWLEDGE BASE):
The user's query combines attached documents with broader questions. Authoritative attached files and relevant Knowledge Base excerpts are provided below.`;
    }

    const systemPrompt = `You are Synapse AI, an intelligent AI workspace assistant equipped with an Intent-Aware Context Engine.

${headerNotice}${memoryBlock}

IMPORTANT INSTRUCTIONS:
1. Base your answer PRIMARILY on the provided "RETRIEVED KNOWLEDGE CONTEXT".
2. Whenever you use information from a source, cite the source clearly inline using [Source N: filename (Page X)] format matching the source header.
3. Be transparent: distinguish between facts stated directly in the retrieved documents and general reasoning.
4. If the retrieved documents DO NOT contain sufficient information to answer the question confidently, explicitly state: "I couldn't find enough information in your uploaded documents to answer confidently." Do NOT fabricate facts or cite fake documents.
5. Format your output using clean Markdown (headers, bullet points, code blocks where appropriate).

RETRIEVED KNOWLEDGE CONTEXT:
${ragContext.formattedContextText}`;

    return {
      systemPrompt,
      augmentedUserQuery: userQuery,
    };
  }
}
