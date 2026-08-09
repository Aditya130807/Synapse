import prisma from '../../lib/prisma.js';
import { ApiError } from '../../utils/ApiError.js';
import type {
  ConversationDTO,
  MessageDTO,
  MessageRole,
  ConversationStatus,
} from './chat.types.js';

/** Generates a clean 40-char max conversation title from the first prompt. */
function generateAutoTitle(prompt: string): string {
  const firstLine = prompt.trim().split('\n')[0] || '';
  const clean = firstLine.replace(/^[#*`>\s]+/, '').trim();
  if (!clean) return 'New Conversation';
  if (clean.length <= 40) return clean;
  return clean.substring(0, 40).trim() + '...';
}

export async function getConversations(userId: string): Promise<ConversationDTO[]> {
  const conversations = await prisma.conversation.findMany({
    where: {
      userId,
      status: 'active',
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });

  return conversations;
}

export async function createConversation(
  userId: string,
  title?: string,
): Promise<ConversationDTO> {
  const conversation = await prisma.conversation.create({
    data: {
      userId,
      title: title && title.trim() ? title.trim() : 'New Conversation',
    },
  });

  return conversation;
}

export async function renameConversation(
  userId: string,
  id: string,
  title?: string,
  status?: ConversationStatus,
): Promise<ConversationDTO> {
  const existing = await prisma.conversation.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    throw new ApiError(404, 'Conversation not found');
  }

  const updated = await prisma.conversation.update({
    where: { id },
    data: {
      ...(title !== undefined && { title: title.trim() }),
      ...(status !== undefined && { status }),
    },
  });

  return updated;
}

export async function deleteConversation(userId: string, id: string): Promise<void> {
  const existing = await prisma.conversation.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    throw new ApiError(404, 'Conversation not found');
  }

  await prisma.conversation.delete({
    where: { id },
  });
}

export async function getMessages(
  userId: string,
  conversationId: string,
  options?: { cursor?: string; limit?: number },
): Promise<{ messages: MessageDTO[]; nextCursor?: string }> {
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, userId },
  });

  if (!conversation) {
    throw new ApiError(404, 'Conversation not found');
  }

  const limit = options?.limit ?? 100;
  const cursor = options?.cursor;

  const messages = await prisma.message.findMany({
    where: { conversationId },
    include: {
      attachments: {
        include: {
          file: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
    take: limit + 1,
    ...(cursor && {
      cursor: { id: cursor },
      skip: 1,
    }),
  });

  let nextCursor: string | undefined = undefined;
  if (messages.length > limit) {
    const nextItem = messages.pop();
    nextCursor = nextItem?.id;
  }

  return {
    messages: messages as MessageDTO[],
    nextCursor,
  };
}

export async function createMessage(
  userId: string,
  conversationId: string,
  role: MessageRole,
  content: string,
  metadata?: Record<string, unknown>,
  fileIds?: string[],
  attachmentSources?: Record<string, string>,
): Promise<MessageDTO> {
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, userId },
  });

  if (!conversation) {
    throw new ApiError(404, 'Conversation not found');
  }

  // Auto-generate conversation title from first user prompt if title is default 'New Conversation'
  const isDefaultTitle = conversation.title === 'New Conversation';
  const shouldAutoTitle = role === 'user' && isDefaultTitle;
  const newTitle = shouldAutoTitle ? generateAutoTitle(content) : undefined;

  const createdMessage = await prisma.message.create({
    data: {
      conversationId,
      role,
      content,
      metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
    },
  });

  // Attach message knowledge files if provided
  if (fileIds && fileIds.length > 0) {
    for (const fId of fileIds) {
      const source = attachmentSources?.[fId] || 'existing';
      await prisma.messageKnowledgeFile.upsert({
        where: {
          messageId_fileId: {
            messageId: createdMessage.id,
            fileId: fId,
          },
        },
        create: {
          messageId: createdMessage.id,
          fileId: fId,
          source,
        },
        update: {
          source,
        },
      });

      // Maintain persistent conversation knowledge context
      await prisma.conversationKnowledgeFile.upsert({
        where: {
          conversationId_fileId: {
            conversationId,
            fileId: fId,
          },
        },
        create: {
          conversationId,
          fileId: fId,
          isPinned: true,
        },
        update: {},
      });
    }
  }

  await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      updatedAt: new Date(),
      ...(newTitle && { title: newTitle }),
    },
  });

  const fullMessage = await prisma.message.findUnique({
    where: { id: createdMessage.id },
    include: {
      attachments: {
        include: {
          file: true,
        },
      },
    },
  });

  return fullMessage as MessageDTO;
}

export async function updateMessage(
  userId: string,
  conversationId: string,
  messageId: string,
  updates: { content?: string; metadata?: Record<string, unknown> },
): Promise<MessageDTO> {
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, userId },
  });

  if (!conversation) {
    throw new ApiError(404, 'Conversation not found');
  }

  const existing = await prisma.message.findFirst({
    where: { id: messageId, conversationId },
  });

  if (!existing) {
    throw new ApiError(404, 'Message not found');
  }

  const updated = await prisma.message.update({
    where: { id: messageId },
    data: {
      ...(updates.content !== undefined && { content: updates.content }),
      ...(updates.metadata !== undefined && { metadata: JSON.parse(JSON.stringify(updates.metadata)) }),
    },
    include: {
      attachments: {
        include: {
          file: true,
        },
      },
    },
  });

  return updated as MessageDTO;
}

export async function deleteMessage(
  userId: string,
  conversationId: string,
  messageId: string,
): Promise<void> {
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, userId },
  });

  if (!conversation) {
    throw new ApiError(404, 'Conversation not found');
  }

  const existing = await prisma.message.findFirst({
    where: { id: messageId, conversationId },
  });

  if (!existing) {
    throw new ApiError(404, 'Message not found');
  }

  await prisma.message.delete({
    where: { id: messageId },
  });
}

export async function prepareRegenerate(
  userId: string,
  conversationId: string,
): Promise<void> {
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, userId },
  });

  if (!conversation) {
    throw new ApiError(404, 'Conversation not found');
  }

  const lastMessage = await prisma.message.findFirst({
    where: { conversationId },
    orderBy: { createdAt: 'desc' },
  });

  if (lastMessage && lastMessage.role === 'assistant') {
    await prisma.message.delete({
      where: { id: lastMessage.id },
    });
  }
}
