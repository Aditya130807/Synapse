import type { DocumentParser } from './parser.interface.js';
import type { ParsedDocument } from '../documentProcessor.types.js';

export class PdfParser implements DocumentParser {
  supports(extension: string): boolean {
    return extension.toLowerCase() === 'pdf';
  }

  async parse(buffer: Buffer): Promise<ParsedDocument> {
    try {
      // 1. Dynamic import / require for compatibility across CommonJS / ESM pdf-parse versions
      let pdfParseModule: any;
      try {
        pdfParseModule = await import('pdf-parse');
      } catch {
        pdfParseModule = require('pdf-parse');
      }

      // Handle PDFParse class (v2+)
      const PDFParseClass = pdfParseModule?.PDFParse || pdfParseModule?.default?.PDFParse;
      if (typeof PDFParseClass === 'function') {
        const instance = new PDFParseClass({ data: buffer });
        const result = await instance.getText();
        const info = typeof instance.getInfo === 'function' ? await instance.getInfo().catch(() => null) : null;
        await instance.destroy().catch(() => {});

        return {
          text: result.text || '',
          pageCount: result.total || (result.pages ? result.pages.length : 1),
          metadata: {
            info,
            total: result.total,
          },
        };
      }

      // Handle default function export (v1.x)
      const pdfParseFn = typeof pdfParseModule === 'function'
        ? pdfParseModule
        : pdfParseModule?.default || pdfParseModule?.pdfParse;

      if (typeof pdfParseFn === 'function') {
        const data = await pdfParseFn(buffer);
        return {
          text: data.text || '',
          pageCount: data.numpages || 1,
          metadata: {
            info: data.info,
            metadata: data.metadata,
          },
        };
      }

      throw new Error('Loaded pdf-parse package does not export a valid PDFParse constructor or pdfParse function.');
    } catch (error: any) {
      throw new Error(`PDF parser failed: ${error.message || error}`);
    }
  }
}
