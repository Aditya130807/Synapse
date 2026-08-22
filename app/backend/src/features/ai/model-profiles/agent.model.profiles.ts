import { env } from '../../../config/env.js';

export interface AgentModelProfile {
  agentId: string;
  primary: string;
  fallbacks: string[];
  maxAttempts: number;
  requiresTools?: boolean;
}

function parseFallbackString(raw: string): string[] {
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function getModelProfile(agentId: string): AgentModelProfile {
  switch (agentId) {
    case 'general':
      return {
        agentId: 'general',
        primary: env.GENERAL_AGENT_MODEL,
        fallbacks: parseFallbackString(env.GENERAL_AGENT_FALLBACK_MODELS),
        maxAttempts: 3,
      };

    case 'coding':
      return {
        agentId: 'coding',
        primary: env.CODING_AGENT_MODEL,
        fallbacks: parseFallbackString(env.CODING_AGENT_FALLBACK_MODELS),
        maxAttempts: 3,
      };

    case 'research':
      return {
        agentId: 'research',
        primary: env.RESEARCH_AGENT_MODEL,
        fallbacks: parseFallbackString(env.RESEARCH_AGENT_FALLBACK_MODELS),
        maxAttempts: 3,
        requiresTools: true,
      };

    case 'document':
      return {
        agentId: 'document',
        primary: env.DOCUMENT_AGENT_MODEL,
        fallbacks: parseFallbackString(env.DOCUMENT_AGENT_FALLBACK_MODELS),
        maxAttempts: 3,
      };

    case 'synthesis':
      return {
        agentId: 'synthesis',
        primary: env.SYNTHESIS_AGENT_MODEL,
        fallbacks: parseFallbackString(env.SYNTHESIS_AGENT_FALLBACK_MODELS),
        maxAttempts: 3,
      };

    default:
      return {
        agentId,
        primary: env.GENERAL_AGENT_MODEL,
        fallbacks: parseFallbackString(env.GENERAL_AGENT_FALLBACK_MODELS),
        maxAttempts: 3,
      };
  }
}
