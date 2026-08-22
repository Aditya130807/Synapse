import dotenv from 'dotenv';
import path from 'path';
import { DEFAULT_SYSTEM_PROMPT } from '../features/ai/ai.config.js';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  DATABASE_URL: process.env.DATABASE_URL || '',
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  // --- AI Provider Selection ---
  AI_PROVIDER: process.env.AI_PROVIDER || 'omniroute',
  SYSTEM_PROMPT: process.env.SYSTEM_PROMPT || DEFAULT_SYSTEM_PROMPT,

  // --- OmniRoute Provider ---
  OMNIROUTE_BASE_URL: process.env.OMNIROUTE_BASE_URL || 'http://localhost:20128/v1',
  OMNIROUTE_API_KEY: process.env.OMNIROUTE_API_KEY || '',

  // --- OpenRouter ---
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '',
  OPENROUTER_MODEL: process.env.OPENROUTER_MODEL || 'openai/gpt-oss-20b:free',

  // --- Agent-Specific Primary & Fallback Models ---
  GENERAL_AGENT_MODEL: process.env.GENERAL_AGENT_MODEL || 'auto/best-fast',
  GENERAL_AGENT_FALLBACK_MODELS: process.env.GENERAL_AGENT_FALLBACK_MODELS || 'auto/fast,auto/chat',

  CODING_AGENT_MODEL: process.env.CODING_AGENT_MODEL || 'auto/best-coding',
  CODING_AGENT_FALLBACK_MODELS: process.env.CODING_AGENT_FALLBACK_MODELS || 'auto/coding:reliable,auto/coding:fast',

  RESEARCH_AGENT_MODEL: process.env.RESEARCH_AGENT_MODEL || 'auto/best-reasoning',
  RESEARCH_AGENT_FALLBACK_MODELS: process.env.RESEARCH_AGENT_FALLBACK_MODELS || 'auto/pro-reasoning,auto/reasoning',

  DOCUMENT_AGENT_MODEL: process.env.DOCUMENT_AGENT_MODEL || 'aug/sonnet4.6-500k',
  DOCUMENT_AGENT_FALLBACK_MODELS: process.env.DOCUMENT_AGENT_FALLBACK_MODELS || 'auto/smart,oc/deepseek-v4-flash-free',

  SYNTHESIS_AGENT_MODEL: process.env.SYNTHESIS_AGENT_MODEL || 'auto/smart',
  SYNTHESIS_AGENT_FALLBACK_MODELS: process.env.SYNTHESIS_AGENT_FALLBACK_MODELS || 'auto/pro-reasoning,auto/reasoning',

  ENABLE_GENERAL_AGENT_EMERGENCY_FALLBACK: process.env.ENABLE_GENERAL_AGENT_EMERGENCY_FALLBACK ?? 'true',

  // --- Future providers ---
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
  ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-20241022',
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  GROQ_MODEL: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
  OLLAMA_URL: process.env.OLLAMA_URL || 'http://localhost:11434',
  OLLAMA_MODEL: process.env.OLLAMA_MODEL || 'llama3.2',
  AZURE_OPENAI_ENDPOINT: process.env.AZURE_OPENAI_ENDPOINT || '',
  AZURE_OPENAI_API_KEY: process.env.AZURE_OPENAI_API_KEY || '',
  AZURE_OPENAI_DEPLOYMENT: process.env.AZURE_OPENAI_DEPLOYMENT || '',
} as const;
