import type { Request, Response, NextFunction } from 'express';
import * as chatService from './chat.service.js';
import { generateAIResponse, generateStreamAIResponse } from '../ai/index.js';
import type {
  CreateConversationBody,
  UpdateConversationBody,
  CreateMessageBody,
  GetMessagesQuery,
} from './chat.types.js';

export async function getConversationsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.sub;
    const conversations = await chatService.getConversations(userId);
    res.status(200).json({ conversations });
  } catch (error) {
    next(error);
  }
}

export async function createConversationHandler(
  req: Request<object, object, CreateConversationBody>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.sub;
    const conversation = await chatService.createConversation(userId, req.body.title);
    res.status(201).json({ conversation });
  } catch (error) {
    next(error);
  }
}

export async function renameConversationHandler(
  req: Request<{ id: string }, object, UpdateConversationBody>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.sub;
    const conversation = await chatService.renameConversation(
      userId,
      req.params.id,
      req.body.title,
      req.body.status,
    );
    res.status(200).json({ conversation });
  } catch (error) {
    next(error);
  }
}

export async function deleteConversationHandler(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.sub;
    await chatService.deleteConversation(userId, req.params.id);
    res.status(200).json({ status: 'success', message: 'Conversation deleted' });
  } catch (error) {
    next(error);
  }
}

export async function getMessagesHandler(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.sub;
    const { cursor, limit } = (req.validatedQuery ?? {}) as GetMessagesQuery;
    const result = await chatService.getMessages(userId, req.params.id, {
      cursor,
      limit,
    });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function createMessageHandler(
  req: Request<{ id: string }, object, CreateMessageBody>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.sub;
    const conversationId = req.params.id;

    // 1. Save the user message
    const userMessage = await chatService.createMessage(
      userId,
      conversationId,
      req.body.role,
      req.body.content,
      req.body.metadata,
      req.body.fileIds,
      req.body.attachmentSources,
    );

    // 2. Generate and save the AI response (only for user-role messages)
    if (req.body.role === 'user') {
      const assistantMessage = await generateAIResponse(userId, conversationId);
      res.status(201).json({ userMessage, assistantMessage });
      return;
    }

    res.status(201).json({ userMessage, assistantMessage: null });
  } catch (error) {
    next(error);
  }
}

export async function createStreamMessageHandler(
  req: Request<{ id: string }, object, CreateMessageBody>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.sub;
    const conversationId = req.params.id;

    const userMessage = await chatService.createMessage(
      userId,
      conversationId,
      req.body.role,
      req.body.content,
      req.body.metadata,
      req.body.fileIds,
      req.body.attachmentSources,
    );


    if (req.body.role !== 'user') {
      res.status(201).json({ userMessage, assistantMessage: null });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const abortController = new AbortController();
    req.on('close', () => {
      if (!res.writableEnded) {
        abortController.abort();
      }
    });

    res.write(`data: ${JSON.stringify({ type: 'userMessage', userMessage })}\n\n`);

    const onChunk = (chunk: string) => {
      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify({ type: 'token', content: chunk })}\n\n`);
      }
    };

    const assistantMessage = await generateStreamAIResponse(
      userId,
      conversationId,
      onChunk,
      abortController.signal,
    );

    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ type: 'done', assistantMessage })}\n\n`);
      res.end();
    }
  } catch (error) {
    if (res.headersSent) {
      if (!res.writableEnded) {
        const message = error instanceof Error ? error.message : 'Streaming error';
        res.write(`data: ${JSON.stringify({ type: 'error', message })}\n\n`);
        res.end();
      }
    } else {
      next(error);
    }
  }
}

export async function updateMessageHandler(
  req: Request<{ id: string; messageId: string }, object, { content?: string; metadata?: Record<string, unknown> }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.sub;
    const { id: conversationId, messageId } = req.params;
    const message = await chatService.updateMessage(userId, conversationId, messageId, req.body);
    res.status(200).json({ message });
  } catch (error) {
    next(error);
  }
}

export async function deleteMessageHandler(
  req: Request<{ id: string; messageId: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.sub;
    const { id: conversationId, messageId } = req.params;
    await chatService.deleteMessage(userId, conversationId, messageId);
    res.status(200).json({ status: 'success', message: 'Message deleted' });
  } catch (error) {
    next(error);
  }
}

export async function regenerateStreamMessageHandler(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.sub;
    const conversationId = req.params.id;

    // Delete trailing assistant message so fresh response replaces it
    await chatService.prepareRegenerate(userId, conversationId);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const abortController = new AbortController();
    req.on('close', () => {
      if (!res.writableEnded) {
        abortController.abort();
      }
    });

    const onChunk = (chunk: string) => {
      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify({ type: 'token', content: chunk })}\n\n`);
      }
    };

    const assistantMessage = await generateStreamAIResponse(
      userId,
      conversationId,
      onChunk,
      abortController.signal,
    );

    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ type: 'done', assistantMessage })}\n\n`);
      res.end();
    }
  } catch (error) {
    if (res.headersSent) {
      if (!res.writableEnded) {
        const message = error instanceof Error ? error.message : 'Streaming error';
        res.write(`data: ${JSON.stringify({ type: 'error', message })}\n\n`);
        res.end();
      }
    } else {
      next(error);
    }
  }
}
