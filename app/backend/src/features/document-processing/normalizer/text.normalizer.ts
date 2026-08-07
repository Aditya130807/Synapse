export class TextNormalizer {
  static normalize(text: string): string {
    if (!text) return '';

    // 1. Normalize carriage returns to standard newlines
    let normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // 2. Split into lines and strip trailing whitespace on each line
    const lines = normalized.split('\n').map((line) => {
      // Don't strip indentation if it's code/markdown block
      return line.trimEnd();
    });

    normalized = lines.join('\n');

    // 3. Compress 3+ consecutive newlines into 2 newlines (preserving paragraph breaks)
    normalized = normalized.replace(/\n{3,}/g, '\n\n');

    return normalized.trim();
  }
}
