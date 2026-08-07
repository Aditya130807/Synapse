import prisma from '../../lib/prisma.js';
import { storageProvider } from '../../lib/storage/local.storage.js';
import { ParserFactory } from './parser/parser.factory.js';
import { TextNormalizer } from './normalizer/text.normalizer.js';
import { SemanticChunker } from './chunker/semantic.chunker.js';
import { MetadataExtractor } from './metadata/metadata.extractor.js';
import type { ProcessedDocumentResult } from './documentProcessor.types.js';

export class DocumentProcessorService {
  /**
   * Process a KnowledgeFile asynchronously:
   * status = uploaded -> processing -> processed / failed
   */
  async processFile(fileId: string): Promise<ProcessedDocumentResult> {
    try {
      const file = await prisma.knowledgeFile.findUnique({
        where: { id: fileId },
      });

      if (!file) {
        throw new Error(`File not found: ${fileId}`);
      }

      // 1. Mark file status as 'processing'
      await prisma.knowledgeFile.update({
        where: { id: fileId },
        data: { status: 'processing' },
      });

      // 2. Fetch file buffer from local storage
      const buffer = await storageProvider.getFileBuffer(file.path);

      // 3. Get parser for file extension
      const parser = ParserFactory.getParser(file.extension);

      // 4. Parse document
      const parsedDoc = await parser.parse(buffer, file.originalName);

      // 5. Normalize text
      const normalizedText = TextNormalizer.normalize(parsedDoc.text);

      // 6. Generate semantic overlapping chunks
      const chunks = SemanticChunker.chunkText(normalizedText);

      // 7. Calculate token estimates & totals
      const totalTokenCount = MetadataExtractor.extractTokenCount(chunks);
      const pageCount = parsedDoc.pageCount || 1;

      // 8. Save chunks and update KnowledgeFile in a single database transaction
      await prisma.$transaction([
        // Clear old chunks if any
        prisma.knowledgeChunk.deleteMany({
          where: { fileId },
        }),

        // Create new chunks
        ...(chunks.length > 0
          ? [
              prisma.knowledgeChunk.createMany({
                data: chunks.map((c) => ({
                  fileId,
                  chunkIndex: c.chunkIndex,
                  page: c.page ?? null,
                  content: c.content,
                  tokenEstimate: c.tokenEstimate,
                })),
              }),
            ]
          : []),

        // Update KnowledgeFile audit & status
        prisma.knowledgeFile.update({
          where: { id: fileId },
          data: {
            status: 'processed',
            tokenCount: totalTokenCount,
            pageCount,
            processedAt: new Date(),
          },
        }),
      ]);

      // 9. Generate vector embeddings for all document chunks & index into Vector DB
      try {
        const { embeddingService } = await import('../embeddings/embedding.service.js');
        await embeddingService.processFileEmbeddings(fileId);
      } catch (embedErr) {
        console.warn(`Vector embedding index warning for file ${fileId}:`, embedErr);
      }

      return {
        fileId,
        status: 'processed',
        pageCount,
        tokenCount: totalTokenCount,
        chunksCount: chunks.length,
      };

    } catch (error: any) {
      console.error(`Document processing failed for file ${fileId}:`, error);

      // Mark file status as 'failed'
      await prisma.knowledgeFile.update({
        where: { id: fileId },
        data: { status: 'failed' },
      }).catch(() => {});

      return {
        fileId,
        status: 'failed',
        tokenCount: 0,
        chunksCount: 0,
        error: error.message || 'Document processing failed',
      };
    }
  }

  /**
   * Enqueue background file processing without blocking HTTP response
   */
  enqueue(fileId: string): void {
    setImmediate(() => {
      this.processFile(fileId).catch((err) => {
        console.error(`Background document processing error for ${fileId}:`, err);
      });
    });
  }
}

export const documentProcessorService = new DocumentProcessorService();
