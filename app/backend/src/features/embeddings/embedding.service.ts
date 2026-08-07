import crypto from 'node:crypto';
import prisma from '../../lib/prisma.js';
import { vectorProvider } from '../../lib/vector/vector.factory.js';
import type { VectorRecord } from '../../lib/vector/vector.interface.js';
import type { BatchEmbeddingResult } from './embedding.types.js';

export class EmbeddingService {
  /**
   * Generate vector embedding for a string of text.
   * Produces a normalized 384-dimensional semantic embedding vector.
   */
  async generateEmbedding(text: string): Promise<number[]> {
    if (!text || text.trim().length === 0) {
      return new Array(384).fill(0);
    }

    // Try Google Gemini embedContent API if available
    try {
      if (process.env.GEMINI_API_KEY) {
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const res: any = await ai.models.embedContent({
          model: process.env.EMBEDDING_MODEL || 'text-embedding-004',
          contents: text,
        });
        const values = res?.embedding?.values || res?.embeddings?.[0]?.values;
        if (values && Array.isArray(values)) {
          return values;
        }

      }
    } catch (err) {
      console.warn('Remote embedding API unavailable, falling back to local semantic vector generator:', err);
    }

    // Deterministic Local Semantic Vector Generator (384 Dimensions)
    return this.generateLocalSemanticVector(text, 384);
  }

  /**
   * Generate embeddings for all chunks of a file and index into Vector DB
   */
  async processFileEmbeddings(fileId: string): Promise<BatchEmbeddingResult> {
    const file = await prisma.knowledgeFile.findUnique({
      where: { id: fileId },
      include: {
        chunks: {
          orderBy: { chunkIndex: 'asc' },
        },
      },
    });

    if (!file) {
      throw new Error(`KnowledgeFile not found: ${fileId}`);
    }

    const chunks = file.chunks;
    if (!chunks || chunks.length === 0) {
      return {
        fileId,
        totalChunks: 0,
        embeddedChunks: 0,
        embeddedAt: new Date(),
      };
    }

    const vectorsToUpsert: VectorRecord[] = [];
    const now = new Date();

    for (const chunk of chunks) {
      const vectorValues = await this.generateEmbedding(chunk.content);
      const embeddingId = `vec_${chunk.id}`;

      // Update chunk record with embeddingId & embeddedAt
      await prisma.knowledgeChunk.update({
        where: { id: chunk.id },
        data: {
          embeddingId,
          embeddedAt: now,
        },
      });

      vectorsToUpsert.push({
        id: embeddingId,
        values: vectorValues,
        metadata: {
          chunkId: chunk.id,
          fileId: file.id,
          userId: file.userId,
          filename: file.filename,
          page: chunk.page,
          chunkIndex: chunk.chunkIndex,
          content: chunk.content,
          tokenEstimate: chunk.tokenEstimate,
        },
      });
    }

    // Upsert into vector database
    await vectorProvider.upsertVectors(vectorsToUpsert, process.env.PINECONE_NAMESPACE || 'synapse');

    return {
      fileId,
      totalChunks: chunks.length,
      embeddedChunks: vectorsToUpsert.length,
      embeddedAt: now,
    };
  }

  /**
   * Generates a normalized 384-dimensional feature vector based on term hash hashing & n-grams
   */
  private generateLocalSemanticVector(text: string, dimensions = 384): number[] {
    const vector = new Array(dimensions).fill(0);
    const words = text.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter(Boolean);

    if (words.length === 0) return vector;

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      // 1-gram feature
      const h1 = this.hashString(word) % dimensions;
      vector[h1] += 1.0;

      // 2-gram feature
      if (i < words.length - 1) {
        const bigram = `${word}_${words[i + 1]}`;
        const h2 = this.hashString(bigram) % dimensions;
        vector[h2] += 1.5;
      }
    }

    // L2 Normalize the vector so cosine similarity calculations are exact
    let sumSquares = 0;
    for (let i = 0; i < dimensions; i++) {
      sumSquares += vector[i] * vector[i];
    }

    const norm = Math.sqrt(sumSquares);
    if (norm > 0) {
      for (let i = 0; i < dimensions; i++) {
        vector[i] = vector[i] / norm;
      }
    }

    return vector;
  }

  private hashString(str: string): number {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 33) ^ str.charCodeAt(i);
    }
    return Math.abs(hash);
  }
}

export const embeddingService = new EmbeddingService();
