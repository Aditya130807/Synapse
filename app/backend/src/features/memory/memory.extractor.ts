import * as memoryService from './memory.service.js';
import type { MemoryType } from './memory.types.js';
import prisma from '../../lib/prisma.js';
import * as workspaceMemoryService from '../workspace-memory/workspace-memory.service.js';
import type { WorkspaceMemoryType } from '../workspace-memory/workspace-memory.types.js';

/**
 * Asynchronously extracts durable facts, preferences, decisions, and goals
 * from recent conversational exchanges without blocking the user response stream.
 */
export async function extractMemoriesAsync(
  userId: string,
  conversationId: string,
  userMessage: string,
  assistantResponse: string
): Promise<void> {
  try {
    const text = userMessage.trim();
    if (!text || text.length < 5) return;

    // Pattern matching rules for common memory declarations
    const extractedItems: Array<{ content: string; type: MemoryType; importance: number }> = [];

    // Preferences & Stack declarations
    const databaseMatch = text.match(/(?:our|the|using)\s+database\s+is\s+([A-Za-z0-9_\-\.]+)/i) ||
                          text.match(/(?:using|use)\s+([A-Za-z0-9_\-\.]+)\s+(?:as\s+(?:our|the)\s+database|for\s+database)/i) ||
                          text.match(/(?:for\s+this\s+project,?\s+)?([A-Za-z0-9_\-\.]+)\s+is\s+our\s+database/i);
    if (databaseMatch && databaseMatch[1]) {
      extractedItems.push({
        content: `The project database is ${databaseMatch[1]}`,
        type: 'decision',
        importance: 0.9,
      });
    }

    const buildingMatch = text.match(/I\s+am\s+building\s+([^\.]+?)(?:\.|$)/i) ||
                          text.match(/(?:we're|we\s+are)\s+building\s+([^\.]+?)(?:\.|$)/i);
    if (buildingMatch && buildingMatch[1]) {
      extractedItems.push({
        content: `The user is building ${buildingMatch[1].trim()}`,
        type: 'goal',
        importance: 0.8,
      });
    }

    const preferMatch = text.match(/(?:prefer|use)\s+([A-Za-z0-9_\-\.\s]{3,30})\s+(?:for\s+this|for\s+our|in\s+this)\s+(?:project|app|codebase)/i) ||
                        text.match(/(?:for\s+this\s+project,?\s+)?use\s+([A-Za-z0-9_\-\.\s]{3,30})/i);
    if (preferMatch && preferMatch[1] && !databaseMatch) {
      const matchText = preferMatch[1].trim();
      if (!matchText.toLowerCase().startsWith('what') && !matchText.toLowerCase().startsWith('how')) {
        extractedItems.push({
          content: `Project preference: ${matchText}`,
          type: 'preference',
          importance: 0.7,
        });
      }
    }

    // Save extracted memories (deduplicated internally by memoryService.createMemory)
    for (const item of extractedItems) {
      await memoryService.createMemory(userId, conversationId, {
        content: item.content,
        type: item.type,
        importance: item.importance,
      });
    }

    // Workspace Memory Promotion: only promote high-confidence durable items
    const workspacePromotionThreshold = 0.8;
    for (const item of extractedItems) {
      if (item.importance >= workspacePromotionThreshold && item.type !== 'summary') {
        try {
          await workspaceMemoryService.createWorkspaceMemory(userId, {
            content: item.content,
            type: item.type as WorkspaceMemoryType,
            importance: item.importance,
          });
        } catch {
          // Silently skip — workspace memory deduplication may prevent creation
        }
      }
    }

    // Long Conversation Summarization check
    const messageCount = await prisma.message.count({ where: { conversationId } });
    if (messageCount >= 15 && messageCount % 5 === 0) {
      await summarizeConversationAsync(userId, conversationId);
    }
  } catch (err) {
    console.error('[MemoryExtractor] Failed to extract memories:', err);
  }
}

/**
 * Summarizes long conversations into a rolling summary memory
 */
export async function summarizeConversationAsync(
  userId: string,
  conversationId: string
): Promise<void> {
  try {
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: 20,
    });

    if (messages.length < 10) return;

    const userPrompts = messages.filter((m) => m.role === 'user').map((m) => m.content.slice(0, 100));
    const summaryText = `Conversation Summary (${messages.length} messages): Discussion focused on ${userPrompts.slice(0, 4).join('; ')}.`;

    await memoryService.createMemory(userId, conversationId, {
      content: summaryText,
      type: 'summary',
      importance: 0.6,
      isPinned: false,
    });
  } catch (err) {
    console.error('[MemoryExtractor] Failed to summarize conversation:', err);
  }
}
