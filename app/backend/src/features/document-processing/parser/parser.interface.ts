import type { ParsedDocument } from '../documentProcessor.types.js';

export interface DocumentParser {
  supports(extension: string): boolean;
  parse(buffer: Buffer, originalName?: string): Promise<ParsedDocument>;
}
