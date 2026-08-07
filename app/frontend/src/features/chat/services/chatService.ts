import api from '@/lib/api';
import type { Conversation, Message, MessageRole } from '../chat.types';

export const chatService = {
  async getConversations(): Promise<Conversation[]> {
    const response = await api.get<{ conversations: Conversation[] }>('/chat');
    return response.data.conversations;
  },

  async createConversation(title?: string): Promise<Conversation> {
    const response = await api.post<{ conversation: Conversation }>('/chat', { title });
    return response.data.conversation;
  },

  async renameConversation(id: string, title: string): Promise<Conversation> {
    const response = await api.patch<{ conversation: Conversation }>(`/chat/${id}`, { title });
    return response.data.conversation;
  },

  async deleteConversation(id: string): Promise<void> {
    await api.delete(`/chat/${id}`);
  },

  async getMessages(
    conversationId: string,
    params?: { cursor?: string; limit?: number },
  ): Promise<{ messages: Message[]; nextCursor?: string }> {
    const response = await api.get<{ messages: Message[]; nextCursor?: string }>(
      `/chat/${conversationId}/messages`,
      { params },
    );
    return response.data;
  },

  async updateMessage(
    conversationId: string,
    messageId: string,
    updates: { content?: string; metadata?: Record<string, unknown> },
  ): Promise<Message> {
    const response = await api.patch<{ message: Message }>(
      `/chat/${conversationId}/messages/${messageId}`,
      updates,
    );
    return response.data.message;
  },

  async deleteMessage(conversationId: string, messageId: string): Promise<void> {
    await api.delete(`/chat/${conversationId}/messages/${messageId}`);
  },

  async sendUserMessage(
    conversationId: string,
    content: string,
  ): Promise<{ userMessage: Message; assistantMessage: Message }> {
    const response = await api.post<{ userMessage: Message; assistantMessage: Message }>(
      `/chat/${conversationId}/messages`,
      {
        role: 'user' as MessageRole,
        content,
      },
    );
    return response.data;
  },

  async streamUserMessage(
    conversationId: string,
    content: string,
    onChunk: (chunk: string) => void,
    onUserMessage?: (userMessage: Message) => void,
    signal?: AbortSignal,
  ): Promise<{ assistantMessage: Message | null }> {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/chat/${conversationId}/messages/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify({
        role: 'user',
        content,
      }),
      signal,
    });

    if (!response.ok) {
      let message = 'Streaming failed';
      try {
        const errorData = await response.json();
        message = errorData.message || message;
      } catch {
        // Fallback
      }
      throw new Error(message);
    }

    if (!response.body) {
      throw new Error('Streaming response body is unreadable');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let finalAssistantMessage: Message | null = null;

    while (true) {
      if (signal?.aborted) {
        await reader.cancel();
        break;
      }

      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;

        const jsonStr = trimmed.slice(6).trim();
        try {
          const event = JSON.parse(jsonStr);
          if (event.type === 'userMessage' && onUserMessage) {
            onUserMessage(event.userMessage);
          } else if (event.type === 'token') {
            onChunk(event.content);
          } else if (event.type === 'done') {
            finalAssistantMessage = event.assistantMessage;
          } else if (event.type === 'error') {
            throw new Error(event.message || 'Stream error');
          }
        } catch (e: unknown) {
          const errObj = e as { message?: string };
          if (errObj.message && !errObj.message.includes('JSON')) {
            throw e;
          }
        }
      }
    }

    return { assistantMessage: finalAssistantMessage };
  },

  async regenerateStreamMessage(
    conversationId: string,
    onChunk: (chunk: string) => void,
    signal?: AbortSignal,
  ): Promise<{ assistantMessage: Message | null }> {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/chat/${conversationId}/messages/regenerate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
      signal,
    });

    if (!response.ok) {
      let message = 'Regeneration failed';
      try {
        const errorData = await response.json();
        message = errorData.message || message;
      } catch {
        // Fallback
      }
      throw new Error(message);
    }

    if (!response.body) {
      throw new Error('Streaming response body is unreadable');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let finalAssistantMessage: Message | null = null;

    while (true) {
      if (signal?.aborted) {
        await reader.cancel();
        break;
      }

      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;

        const jsonStr = trimmed.slice(6).trim();
        try {
          const event = JSON.parse(jsonStr);
          if (event.type === 'token') {
            onChunk(event.content);
          } else if (event.type === 'done') {
            finalAssistantMessage = event.assistantMessage;
          } else if (event.type === 'error') {
            throw new Error(event.message || 'Stream error');
          }
        } catch (e: unknown) {
          const errObj = e as { message?: string };
          if (errObj.message && !errObj.message.includes('JSON')) {
            throw e;
          }
        }
      }
    }

    return { assistantMessage: finalAssistantMessage };
  },
};
