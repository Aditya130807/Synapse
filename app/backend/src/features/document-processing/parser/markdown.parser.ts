import type { DocumentParser } from './parser.interface.js';
import type { ParsedDocument } from '../documentProcessor.types.js';

export class MarkdownParser implements DocumentParser {
  supports(extension: string): boolean {
    const ext = extension.toLowerCase();
    return ext === 'md' || ext === 'markdown';
  }

  async parse(buffer: Buffer): Promise<ParsedDocument> {
    const text = buffer.toString('utf-8');
    const lineCount = text.split(/\r?\n/).length;
    const estimatedPages = Math.max(1, Math.ceil(lineCount / 50));

    return {
      text,
      pageCount: estimatedPages,
      metadata: {
        format: 'markdown',
        lineCount,
      },
    };
  }
}
