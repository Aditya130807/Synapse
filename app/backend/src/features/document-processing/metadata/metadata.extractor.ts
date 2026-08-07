import type { DocumentChunk } from '../documentProcessor.types.js';

export class MetadataExtractor {
  static extractTokenCount(chunks: DocumentChunk[]): number {
    return chunks.reduce((acc, c) => acc + c.tokenEstimate, 0);
  }
}
