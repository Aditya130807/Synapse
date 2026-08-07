import type { DocumentChunk } from '../documentProcessor.types.js';

export interface ChunkerOptions {
  targetChunkSize?: number; // Default ~800 chars
  minChunkSize?: number;    // Default ~200 chars
  overlapSize?: number;     // Default ~120 chars
}

export class SemanticChunker {
  static chunkText(text: string, options: ChunkerOptions = {}): DocumentChunk[] {
    const {
      targetChunkSize = 800,
      minChunkSize = 150,
      overlapSize = 120,
    } = options;

    if (!text || text.trim().length === 0) {
      return [];
    }

    const chunks: DocumentChunk[] = [];
    const paragraphs = text.split(/\n\n+/);
    
    let currentChunkText = '';
    let chunkIndex = 0;

    for (let i = 0; i < paragraphs.length; i++) {
      const para = paragraphs[i].trim();
      if (!para) continue;

      // If a single paragraph is larger than targetChunkSize, split it by sentences or characters
      if (para.length > targetChunkSize) {
        // Flush any pending text before processing large paragraph
        if (currentChunkText.trim().length >= minChunkSize) {
          chunks.push({
            chunkIndex: chunkIndex++,
            content: currentChunkText.trim(),
            tokenEstimate: Math.ceil(currentChunkText.trim().length / 4),
          });
          // Retain overlap from end of current text
          currentChunkText = currentChunkText.slice(-overlapSize);
        }

        const subChunks = this.splitLargeText(para, targetChunkSize, overlapSize);
        for (const sub of subChunks) {
          chunks.push({
            chunkIndex: chunkIndex++,
            content: sub,
            tokenEstimate: Math.ceil(sub.length / 4),
          });
        }
        currentChunkText = subChunks.length > 0 ? subChunks[subChunks.length - 1].slice(-overlapSize) : '';
        continue;
      }

      // Check if adding this paragraph exceeds targetChunkSize
      if (currentChunkText.length + para.length + 2 > targetChunkSize && currentChunkText.trim().length >= minChunkSize) {
        chunks.push({
          chunkIndex: chunkIndex++,
          content: currentChunkText.trim(),
          tokenEstimate: Math.ceil(currentChunkText.trim().length / 4),
        });

        // Compute overlap buffer for seamless semantic continuity
        const overlapBuffer = currentChunkText.slice(-overlapSize);
        currentChunkText = overlapBuffer + '\n\n' + para;
      } else {
        currentChunkText = currentChunkText ? currentChunkText + '\n\n' + para : para;
      }
    }

    // Flush remaining trailing chunk
    if (currentChunkText.trim().length > 0) {
      chunks.push({
        chunkIndex: chunkIndex++,
        content: currentChunkText.trim(),
        tokenEstimate: Math.ceil(currentChunkText.trim().length / 4),
      });
    }

    return chunks;
  }

  private static splitLargeText(text: string, chunkSize: number, overlap: number): string[] {
    const results: string[] = [];
    let start = 0;

    while (start < text.length) {
      let end = start + chunkSize;
      if (end >= text.length) {
        results.push(text.slice(start).trim());
        break;
      }

      // Look for sentence boundary (.!?) near the end position
      const lastSentenceBoundary = text.lastIndexOf('.', end);
      if (lastSentenceBoundary > start + chunkSize * 0.6) {
        end = lastSentenceBoundary + 1;
      } else {
        // Fall back to space boundary
        const lastSpace = text.lastIndexOf(' ', end);
        if (lastSpace > start + chunkSize * 0.6) {
          end = lastSpace;
        }
      }

      const chunk = text.slice(start, end).trim();
      if (chunk) {
        results.push(chunk);
      }

      start = end - overlap;
      if (start <= 0 || start >= text.length) break;
    }

    return results;
  }
}
