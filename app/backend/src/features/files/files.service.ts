import crypto from 'node:crypto';
import fs from 'node:fs';
import prisma from '../../lib/prisma.js';
import { storageProvider } from '../../lib/storage/local.storage.js';
import { validateFileExtension } from './files.validation.js';
import { FileSort, type ListFilesQuery, type UpdateFilePayload, type UploadFileResult } from './files.types.js';
import type { KnowledgeFile } from '@prisma/client';
import { documentProcessorService } from '../document-processing/documentProcessor.service.js';

export class FilesService {
  async processAndSaveUploadedFile(
    userId: string,
    tempFilePath: string,
    originalName: string,
    mimeType: string,
    size: number,
    conversationId?: string
  ): Promise<UploadFileResult> {
    try {
      const buffer = await fs.promises.readFile(tempFilePath);
      const hash = crypto.createHash('sha256').update(buffer).digest('hex');

      const { extension } = validateFileExtension(originalName);

      // Verify conversation access if conversationId is provided
      if (conversationId) {
        const conv = await prisma.conversation.findFirst({
          where: { id: conversationId, userId },
        });
        if (!conv) {
          throw new Error('Conversation not found');
        }
      }

      // Check for existing per-user duplicate
      let file = await prisma.knowledgeFile.findUnique({
        where: {
          userId_hash: {
            userId,
            hash,
          },
        },
        include: {
          conversations: {
            include: {
              conversation: {
                select: { id: true, title: true },
              },
            },
          },
          chunks: {
            select: { id: true, chunkIndex: true, page: true, tokenEstimate: true, content: true },
            orderBy: { chunkIndex: 'asc' },
          },
        },
      });

      const isDuplicate = !!file;

      if (!file) {
        // Generate file ID and save to storage engine
        const fileId = crypto.randomUUID();
        const relativePath = await storageProvider.saveFile({
          userId,
          fileId,
          extension,
          buffer,
        });

        // Record in PostgreSQL
        file = await prisma.knowledgeFile.create({
          data: {
            id: fileId,
            filename: originalName,
            originalName,
            extension,
            mimeType,
            size,
            path: relativePath,
            hash,
            userId,
            status: 'uploaded',
          },
          include: {
            conversations: {
              include: {
                conversation: {
                  select: { id: true, title: true },
                },
              },
            },
            chunks: {
              select: { id: true, chunkIndex: true, page: true, tokenEstimate: true, content: true },
              orderBy: { chunkIndex: 'asc' },
            },
          },
        });

        // Enqueue background asynchronous document processing
        documentProcessorService.enqueue(file.id);
      }

      // Clean up temp file
      if (fs.existsSync(tempFilePath)) {
        await fs.promises.unlink(tempFilePath).catch(() => {});
      }

      let attached = false;
      if (conversationId) {
        // Link to conversation if not already linked
        await prisma.conversationKnowledgeFile.upsert({
          where: {
            conversationId_fileId: {
              conversationId,
              fileId: file.id,
            },
          },
          create: {
            conversationId,
            fileId: file.id,
            isPinned: true,
          },
          update: {},
        });
        attached = true;
      }

      // Re-fetch file with fresh conversation relations and chunks
      const updatedFile = await prisma.knowledgeFile.findUnique({
        where: { id: file.id },
        include: {
          conversations: {
            include: {
              conversation: {
                select: { id: true, title: true },
              },
            },
          },
          chunks: {
            select: { id: true, chunkIndex: true, page: true, tokenEstimate: true, content: true },
            orderBy: { chunkIndex: 'asc' },
          },
        },
      });

      return {
        file: (updatedFile || file) as any,
        isDuplicate,
        attached,
        message: isDuplicate
          ? 'Already in Knowledge Base. Attached to this conversation.'
          : 'File uploaded and queued for AI document processing.',
      };
    } catch (error) {
      if (fs.existsSync(tempFilePath)) {
        await fs.promises.unlink(tempFilePath).catch(() => {});
      }
      throw error;
    }
  }


  async attachExistingFile(conversationId: string, fileId: string, userId: string) {
    const conv = await prisma.conversation.findFirst({
      where: { id: conversationId, userId },
    });
    if (!conv) {
      throw new Error('Conversation not found');
    }

    const file = await prisma.knowledgeFile.findFirst({
      where: { id: fileId, userId },
    });
    if (!file) {
      throw new Error('Knowledge file not found');
    }

    const attachment = await prisma.conversationKnowledgeFile.upsert({
      where: {
        conversationId_fileId: {
          conversationId,
          fileId,
        },
      },
      create: {
        conversationId,
        fileId,
        isPinned: true,
      },
      update: {},
      include: {
        file: true,
      },
    });

    return attachment;
  }

  async detachFile(conversationId: string, fileId: string, userId: string) {
    const conv = await prisma.conversation.findFirst({
      where: { id: conversationId, userId },
    });
    if (!conv) {
      throw new Error('Conversation not found');
    }

    await prisma.conversationKnowledgeFile.deleteMany({
      where: {
        conversationId,
        fileId,
      },
    });

    return { detached: true };
  }

  async listConversationFiles(conversationId: string, userId: string) {
    const conv = await prisma.conversation.findFirst({
      where: { id: conversationId, userId },
    });
    if (!conv) {
      throw new Error('Conversation not found');
    }

    const attachments = await prisma.conversationKnowledgeFile.findMany({
      where: { conversationId },
      orderBy: { attachedAt: 'desc' },
      include: {
        file: {
          include: {
            conversations: {
              include: {
                conversation: {
                  select: { id: true, title: true },
                },
              },
            },
          },
        },
      },
    });

    return attachments;
  }

  async getAvailableKnowledgeFiles(userId: string, conversationId?: string) {
    const files = await prisma.knowledgeFile.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        conversations: {
          include: {
            conversation: {
              select: { id: true, title: true },
            },
          },
        },
      },
    });

    if (!conversationId) {
      return files;
    }

    const attachedFileIds = new Set(
      (
        await prisma.conversationKnowledgeFile.findMany({
          where: { conversationId },
          select: { fileId: true },
        })
      ).map((a) => a.fileId)
    );

    return files.map((f) => ({
      ...f,
      isAttached: attachedFileIds.has(f.id),
    }));
  }

  async getUserFiles(userId: string, query: ListFilesQuery): Promise<{ files: any[]; totalCount: number; totalSizeBytes: number }> {
    const { search, sort = FileSort.newest } = query;

    const where = {
      userId,
      ...(search
        ? {
            filename: {
              contains: search,
              mode: 'insensitive' as const,
            },
          }
        : {}),
    };

    let orderBy: Record<string, 'asc' | 'desc'> = { createdAt: 'desc' };
    if (sort === FileSort.oldest) {
      orderBy = { createdAt: 'asc' };
    } else if (sort === FileSort.name) {
      orderBy = { filename: 'asc' };
    } else if (sort === FileSort.size) {
      orderBy = { size: 'desc' };
    }

    const files = await prisma.knowledgeFile.findMany({
      where,
      orderBy,
      include: {
        conversations: {
          include: {
            conversation: {
              select: { id: true, title: true },
            },
          },
        },
        chunks: {
          select: { id: true, chunkIndex: true, page: true, tokenEstimate: true, content: true },
          orderBy: { chunkIndex: 'asc' },
        },
      },
    });

    const userStats = await prisma.knowledgeFile.aggregate({
      where: { userId },
      _sum: { size: true },
      _count: { id: true },
    });

    return {
      files,
      totalCount: userStats._count.id || 0,
      totalSizeBytes: userStats._sum.size || 0,
    };
  }

  async getFileById(id: string, userId: string): Promise<any> {
    const file = await prisma.knowledgeFile.findFirst({
      where: { id, userId },
      include: {
        conversations: {
          include: {
            conversation: {
              select: { id: true, title: true },
            },
          },
        },
        chunks: {
          select: { id: true, chunkIndex: true, page: true, tokenEstimate: true, content: true },
          orderBy: { chunkIndex: 'asc' },
        },
      },
    });


    if (!file) {
      throw new Error('File not found');
    }

    return file;
  }

  async updateFile(id: string, userId: string, payload: UpdateFilePayload): Promise<KnowledgeFile> {
    const file = await this.getFileById(id, userId);

    const updated = await prisma.knowledgeFile.update({
      where: { id: file.id },
      data: {
        ...(payload.filename ? { filename: payload.filename } : {}),
      },
    });

    return updated;
  }

  async deleteFile(id: string, userId: string): Promise<void> {
    const file = await this.getFileById(id, userId);

    // Remove physical file from storage
    await storageProvider.deleteFile(file.path);

    // Remove record from database
    await prisma.knowledgeFile.delete({
      where: { id: file.id },
    });
  }

  async getFileContent(id: string, userId: string): Promise<{ file: KnowledgeFile; buffer: Buffer }> {
    const file = await this.getFileById(id, userId);

    // Update last accessed audit timestamp
    await prisma.knowledgeFile.update({
      where: { id: file.id },
      data: { lastAccessedAt: new Date() },
    });

    const buffer = await storageProvider.getFileBuffer(file.path);
    return { file, buffer };
  }

  async getFileStream(id: string, userId: string) {
    const file = await this.getFileById(id, userId);

    await prisma.knowledgeFile.update({
      where: { id: file.id },
      data: { lastAccessedAt: new Date() },
    });

    const stream = storageProvider.getFileStream(file.path);
    return { file, stream };
  }
}


export const filesService = new FilesService();
