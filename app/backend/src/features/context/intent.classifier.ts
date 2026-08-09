import type { ContextStrategyType } from './context.strategy.js';

export class IntentClassifier {
  /**
   * Classify prompt intent based on query keywords and attached message files.
   */
  static classify(query: string, messageFileIds: string[]): ContextStrategyType {
    if (!messageFileIds || messageFileIds.length === 0) {
      return 'conversation';
    }

    const hybridKeywords = [
      'compare',
      'best practice',
      'best practices',
      'search for',
      'from the web',
      'find online',
      'external',
      'industry standard',
      'benchmark',
      'other than this',
      'in general',
    ];

    const lowerQuery = query.toLowerCase();
    const isHybrid = hybridKeywords.some((kw) => lowerQuery.includes(kw));

    if (isHybrid) {
      return 'hybrid';
    }

    return 'attached-document';
  }

  /**
   * Detect whether user prompt explicitly references prior conversation context or files.
   */
  static detectPriorContextReference(query: string): boolean {
    const priorKeywords = [
      'earlier',
      'previous',
      'uploaded earlier',
      'before',
      'last file',
      'first file',
      'prior',
      'past file',
      'compared to',
      'resume I uploaded',
      'continue',
    ];
    const lowerQuery = query.toLowerCase();
    return priorKeywords.some((kw) => lowerQuery.includes(kw));
  }
}
