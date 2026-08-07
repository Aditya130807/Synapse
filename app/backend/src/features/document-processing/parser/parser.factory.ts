import type { DocumentParser } from './parser.interface.js';
import { PdfParser } from './pdf.parser.js';
import { DocxParser } from './docx.parser.js';
import { MarkdownParser } from './markdown.parser.js';
import { TxtParser } from './txt.parser.js';

export class ParserFactory {
  private static parsers: DocumentParser[] = [
    new PdfParser(),
    new DocxParser(),
    new MarkdownParser(),
    new TxtParser(),
  ];

  static getParser(extension: string): DocumentParser {
    const parser = this.parsers.find((p) => p.supports(extension));
    if (!parser) {
      throw new Error(`Unsupported document extension: .${extension}`);
    }
    return parser;
  }
}
