import * as persistentMemoryService from './persistent-memory.service.js';
import type { MemoryPipelineFeedback, PersistentMemoryDTO, MemoryScope, MemoryType } from './persistent-memory.types.js';

export class MemoryPipeline {
  /**
   * Processes an incoming user prompt to detect explicit commands (SAVE/FORGET/VIEW)
   * or automatic persistent instructions.
   */
  public async processIncomingMessage(
    userId: string,
    workspaceId = 'default',
    conversationId: string,
    userMessage: string
  ): Promise<MemoryPipelineFeedback> {
    const text = userMessage.trim();
    if (!text || text.length < 4) {
      return { actionExecuted: 'none' };
    }

    // 1. Check for Explicit FORGET commands
    const forgetMatch = text.match(/^(?:forget|remove|delete)\s+(?:the\s+)?(.+)/i);
    if (forgetMatch && forgetMatch[1]) {
      const targetQuery = forgetMatch[1].trim();
      const forgottenContent = await this.executeForgetCommand(userId, workspaceId, targetQuery);
      if (forgottenContent) {
        return {
          actionExecuted: 'forgotten',
          toastMessage: `🧠 Forgotten: "${forgottenContent}"`,
          forgottenContent,
        };
      }
    }

    // 2. Check for Explicit SAVE commands ("Remember that...", "From now on...", "Save instruction...")
    const saveMatch =
      text.match(/^(?:remember\s+(?:that\s+)?|from\s+now\s+on,?\s+|always\s+use\s+)(.+)/i) ||
      text.match(/(?:please\s+)?remember\s+that\s+(.+)/i);

    if (saveMatch && saveMatch[1]) {
      const contentToSave = saveMatch[1].trim();
      const detected = await this.executeSaveCommand(userId, workspaceId, conversationId, contentToSave, text);
      if (detected) {
        return {
          actionExecuted: 'saved',
          toastMessage: `🧠 Remembered: ${detected.content}`,
          detectedMemory: detected,
        };
      }
    }

    // 3. Check for Explicit VIEW commands ("What do you remember...", "Show my instructions...")
    const isViewCommand =
      /what\s+do\s+you\s+(?:remember|know)\s+about/i.test(text) ||
      /show\s+(?:my\s+)?(?:instructions|memories|preferences)/i.test(text);

    if (isViewCommand) {
      return { actionExecuted: 'viewed' };
    }

    // 4. Automatic Instruction & Preference Detection
    const autoDetected = await this.detectAutomaticInstruction(userId, workspaceId, conversationId, text);
    if (autoDetected) {
      return {
        actionExecuted: 'saved',
        toastMessage: `🧠 Saved persistent rule: ${autoDetected.content}`,
        detectedMemory: autoDetected,
      };
    }

    return { actionExecuted: 'none' };
  }

  private async executeForgetCommand(
    userId: string,
    workspaceId: string,
    targetQuery: string
  ): Promise<string | null> {
    const activeMemories = await persistentMemoryService.getMemories(userId, {
      workspaceId,
      status: 'ACTIVE',
    });

    const targetLower = targetQuery.toLowerCase();
    const match = activeMemories.find((mem) => {
      const memLower = mem.content.toLowerCase();
      return memLower.includes(targetLower) || targetLower.includes(memLower);
    });

    if (match) {
      await persistentMemoryService.deleteMemory(userId, match.id, false);
      return match.content;
    }

    return null;
  }

  private async executeSaveCommand(
    userId: string,
    workspaceId: string,
    conversationId: string,
    rawContent: string,
    fullMessage: string
  ): Promise<PersistentMemoryDTO | null> {
    // Determine scope
    let scope: MemoryScope = 'WORKSPACE';
    if (/for\s+this\s+conversation|in\s+this\s+chat/i.test(fullMessage)) {
      scope = 'CONVERSATION';
    } else if (/across\s+all\s+projects|everywhere|globally|my\s+general\s+preference/i.test(fullMessage)) {
      scope = 'GLOBAL';
    }

    // Determine type
    let type: MemoryType = 'INSTRUCTION';
    if (/prefer|like|favorite/i.test(rawContent)) {
      type = 'PREFERENCE';
    } else if (/must|never|don't|do\s+not/i.test(rawContent)) {
      type = 'CONSTRAINT';
    }

    try {
      return await persistentMemoryService.upsertInstructionOrMemory(userId, {
        content: rawContent,
        scope,
        type,
        workspaceId,
        conversationId,
        source: 'user_explicit',
      });
    } catch {
      return null;
    }
  }

  private async detectAutomaticInstruction(
    userId: string,
    workspaceId: string,
    conversationId: string,
    text: string
  ): Promise<PersistentMemoryDTO | null> {
    // Temporary response filter — do NOT save temporary requests!
    const isTemporaryRequest =
      /for\s+this\s+(?:response|answer|message|prompt)/i.test(text) ||
      /just\s+for\s+now/i.test(text) ||
      /in\s+this\s+one\s+response/i.test(text);

    if (isTemporaryRequest) return null;

    // Pattern 1: Workspace Database/ORM rule
    // e.g. "For this project, always use PostgreSQL and Prisma."
    const dbMatch = text.match(/(?:for\s+this\s+project,?\s+)?always\s+use\s+([A-Za-z0-9_\-\.\s\+]+)\s+with\s+([A-Za-z0-9_\-\.]+)/i) ||
                    text.match(/(?:for\s+this\s+project,?\s+)?our\s+database\s+is\s+([A-Za-z0-9_\-\.]+)/i) ||
                    text.match(/(?:this\s+project|our\s+app)\s+uses\s+([A-Za-z0-9_\-\.\s\+]+)/i);

    if (dbMatch) {
      const extractedContent = dbMatch[0].trim();
      try {
        return await persistentMemoryService.upsertInstructionOrMemory(userId, {
          content: extractedContent,
          scope: 'WORKSPACE',
          type: 'INSTRUCTION',
          workspaceId,
          conversationId,
          source: 'auto_detected',
        });
      } catch {
        return null;
      }
    }

    // Pattern 2: Tech Constraint declaration
    // e.g. "Don't use Firebase in this project", "Never use jQuery"
    const constraintMatch = text.match(/(?:don't|do\s+not|never)\s+use\s+([A-Za-z0-9_\-\.\s]+)\s+(?:in|for)\s+this\s+project/i);
    if (constraintMatch && constraintMatch[1]) {
      const extractedContent = `Do not use ${constraintMatch[1].trim()} in this project.`;
      try {
        return await persistentMemoryService.upsertInstructionOrMemory(userId, {
          content: extractedContent,
          scope: 'WORKSPACE',
          type: 'CONSTRAINT',
          workspaceId,
          conversationId,
          source: 'auto_detected',
        });
      } catch {
        return null;
      }
    }

    // Pattern 3: General language / framework rule
    // e.g. "When writing React, use TypeScript."
    const ruleMatch = text.match(/when\s+writing\s+([A-Za-z0-9_\-\.]+),?\s+(?:always\s+)?use\s+([A-Za-z0-9_\-\.]+)/i);
    if (ruleMatch && ruleMatch[1] && ruleMatch[2]) {
      const extractedContent = `When writing ${ruleMatch[1].trim()}, use ${ruleMatch[2].trim()}.`;
      try {
        return await persistentMemoryService.upsertInstructionOrMemory(userId, {
          content: extractedContent,
          scope: 'GLOBAL',
          type: 'INSTRUCTION',
          workspaceId,
          conversationId,
          source: 'auto_detected',
        });
      } catch {
        return null;
      }
    }

    return null;
  }
}

export const memoryPipeline = new MemoryPipeline();
