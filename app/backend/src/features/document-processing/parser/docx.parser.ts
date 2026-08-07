import mammoth from 'mammoth';
import type { DocumentParser } from './parser.interface.js';
import type { ParsedDocument } from '../documentProcessor.types.js';

export class DocxParser implements DocumentParser {
  supports(extension: string): boolean {
    const ext = extension.toLowerCase();
    return ext === 'docx' || ext === 'doc';
  }

  async parse(buffer: Buffer): Promise<ParsedDocument> {
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value || '';

    // Estimate page count for DOCX based on ~3000 characters per page
    const estimatedPages = Math.max(1, Math.ceil(text.length / 3000));

    return {
      text,
      pageCount: estimatedPages,
      metadata: {
        warnings: result.messages,
      },
    };
  }
}
