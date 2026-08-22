import type { Request, Response } from 'express';
import { filesService } from './files.service.js';
import { listFilesQuerySchema, updateFileSchema } from './files.validation.js';

export async function uploadFile(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      res.status(401).json({ status: 'error', message: 'Authentication required' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ status: 'error', message: 'No file uploaded' });
      return;
    }

    const result = await filesService.processAndSaveUploadedFile(
      userId,
      req.file.path,
      req.file.originalname,
      req.file.mimetype,
      req.file.size
    );

    const statusCode = result.isDuplicate ? 200 : 201;

    res.status(statusCode).json({
      status: 'success',
      data: result.file,
      isDuplicate: result.isDuplicate,
      message: result.message || (result.isDuplicate ? 'File already exists in Knowledge Base' : 'File uploaded successfully'),
    });
  } catch (error: any) {
    res.status(400).json({
      status: 'error',
      message: error.message || 'File upload failed',
    });
  }
}

export async function listFiles(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      res.status(401).json({ status: 'error', message: 'Authentication required' });
      return;
    }

    const query = listFilesQuerySchema.parse(req.query);
    const result = await filesService.getUserFiles(userId, query);

    res.json({
      status: 'success',
      data: result.files,
      meta: {
        totalCount: result.totalCount,
        totalSizeBytes: result.totalSizeBytes,
      },
    });
  } catch (error: any) {
    res.status(400).json({
      status: 'error',
      message: error.message || 'Failed to list files',
    });
  }
}

export async function getFile(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      res.status(401).json({ status: 'error', message: 'Authentication required' });
      return;
    }

    const id = req.params.id as string;
    const file = await filesService.getFileById(id, userId);

    res.json({
      status: 'success',
      data: file,
    });
  } catch (error: any) {
    res.status(404).json({
      status: 'error',
      message: error.message || 'File not found',
    });
  }
}

export async function previewFile(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      res.status(401).json({ status: 'error', message: 'Authentication required' });
      return;
    }

    const id = req.params.id as string;
    const { file, buffer } = await filesService.getFileContent(id, userId);

    const isText = file.extension === 'txt' || file.extension === 'md' || file.extension === 'markdown';
    const isJsonRequested = req.query.parsed === 'true' || req.headers.accept?.includes('application/json');

    if (isText || isJsonRequested) {
      let content = '';
      if (isText) {
        content = buffer.toString('utf-8');
      } else if ((file as any).chunks && (file as any).chunks.length > 0) {
        content = (file as any).chunks.map((c: any) => c.content).join('\n\n');
      }

      res.json({
        status: 'success',
        data: {
          file,
          content,
          chunks: (file as any).chunks || [],
        },
      });
      return;
    }

    // For PDF or DOCX binary previews: return direct file stream with content-type
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (error: any) {
    res.status(404).json({
      status: 'error',
      message: error.message || 'Failed to fetch preview',
    });
  }
}

export async function downloadFile(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      res.status(401).json({ status: 'error', message: 'Authentication required' });
      return;
    }

    const id = req.params.id as string;
    const { file, stream } = await filesService.getFileStream(id, userId);

    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.filename)}"`);
    stream.pipe(res);
  } catch (error: any) {
    res.status(404).json({
      status: 'error',
      message: error.message || 'Failed to download file',
    });
  }
}

export async function updateFile(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      res.status(401).json({ status: 'error', message: 'Authentication required' });
      return;
    }

    const id = req.params.id as string;
    const payload = updateFileSchema.parse(req.body);

    const updated = await filesService.updateFile(id, userId, payload);

    res.json({
      status: 'success',
      data: updated,
    });
  } catch (error: any) {
    res.status(400).json({
      status: 'error',
      message: error.message || 'Failed to update file',
    });
  }
}

export async function uploadConversationFile(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      res.status(401).json({ status: 'error', message: 'Authentication required' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ status: 'error', message: 'No file uploaded' });
      return;
    }

    const conversationId = req.params.id as string | undefined;

    const result = await filesService.processAndSaveUploadedFile(
      userId,
      req.file.path,
      req.file.originalname,
      req.file.mimetype,
      req.file.size,
      conversationId
    );

    const statusCode = result.isDuplicate ? 200 : 201;

    res.status(statusCode).json({
      status: 'success',
      data: result.file,
      file: result.file,
      attached: result.attached ?? true,
      duplicate: result.isDuplicate,
      isDuplicate: result.isDuplicate,
      message: result.message || (result.isDuplicate ? 'Already in Knowledge Base. Attached to this conversation.' : 'File uploaded successfully'),
    });
  } catch (error: any) {
    res.status(400).json({
      status: 'error',
      message: error.message || 'File upload failed',
    });
  }
}

export async function attachExistingFileHandler(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      res.status(401).json({ status: 'error', message: 'Authentication required' });
      return;
    }

    const conversationId = req.params.id as string;
    const { fileId } = req.body;

    if (!fileId) {
      res.status(400).json({ status: 'error', message: 'fileId is required' });
      return;
    }

    const attachment = await filesService.attachExistingFile(conversationId, fileId, userId);

    res.status(201).json({
      status: 'success',
      data: attachment,
      attached: true,
      message: 'File attached to conversation',
    });
  } catch (error: any) {
    res.status(400).json({
      status: 'error',
      message: error.message || 'Failed to attach file',
    });
  }
}

export async function detachConversationFileHandler(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      res.status(401).json({ status: 'error', message: 'Authentication required' });
      return;
    }

    const conversationId = req.params.id as string;
    const fileId = req.params.fileId as string;

    const result = await filesService.detachFile(conversationId, fileId, userId);

    res.json({
      status: 'success',
      data: result,
      message: 'File detached from conversation',
    });
  } catch (error: any) {
    res.status(400).json({
      status: 'error',
      message: error.message || 'Failed to detach file',
    });
  }
}

export async function listConversationFilesHandler(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      res.status(401).json({ status: 'error', message: 'Authentication required' });
      return;
    }

    const conversationId = req.params.id as string;
    const attachments = await filesService.listConversationFiles(conversationId, userId);

    res.json({
      status: 'success',
      data: attachments,
    });
  } catch (error: any) {
    res.status(400).json({
      status: 'error',
      message: error.message || 'Failed to list conversation files',
    });
  }
}

export async function getAvailableKnowledgeFilesHandler(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      res.status(401).json({ status: 'error', message: 'Authentication required' });
      return;
    }

    const conversationId = req.query.conversationId as string | undefined;
    const files = await filesService.getAvailableKnowledgeFiles(userId, conversationId);

    res.json({
      status: 'success',
      data: files,
    });
  } catch (error: any) {
    res.status(400).json({
      status: 'error',
      message: error.message || 'Failed to fetch available knowledge files',
    });
  }
}

export async function removeFile(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      res.status(401).json({ status: 'error', message: 'Authentication required' });
      return;
    }

    const id = req.params.id as string;
    await filesService.deleteFile(id, userId);

    res.json({
      status: 'success',
      message: 'File deleted successfully',
    });
  } catch (error: any) {
    res.status(404).json({
      status: 'error',
      message: error.message || 'Failed to delete file',
    });
  }
}

