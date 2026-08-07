import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { chatService } from '../services/chatService';
import {
  uploadConversationFileApi,
  attachExistingFileApi,
  detachConversationFileApi,
  listConversationFilesApi,
} from '../../files/services/files.api';
import type { AttachedFile } from '../../files/types/files.types';
import type { Conversation, Message, ChatContextType } from '../chat.types';

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [searchParams] = useSearchParams();
  const urlConvId = searchParams.get('id') || searchParams.get('conversationId');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messagesMap, setMessagesMap] = useState<Record<string, Message[]>>({});
  const [attachedFilesMap, setAttachedFilesMap] = useState<Record<string, AttachedFile[]>>({});

  const [isLoadingConversations, setIsLoadingConversations] = useState<boolean>(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const [isLoadingAttachedFiles, setIsLoadingAttachedFiles] = useState<boolean>(false);
  const [isSendingMessage, setIsSendingMessage] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync URL conversation ID parameter if provided
  useEffect(() => {
    if (urlConvId && conversations.length > 0 && conversations.some((c) => c.id === urlConvId)) {
      setSelectedConversationId(urlConvId);
    }
  }, [urlConvId, conversations]);

  // Derived selected conversation
  const selectedConversation = useMemo(
    () => conversations.find((c) => c.id === selectedConversationId) || null,
    [conversations, selectedConversationId],
  );

  // Derived messages for active conversation
  const currentMessages = useMemo(
    () => (selectedConversationId ? messagesMap[selectedConversationId] || [] : []),
    [messagesMap, selectedConversationId],
  );

  // Derived attached files for active conversation
  const attachedFiles = useMemo(
    () => (selectedConversationId ? attachedFilesMap[selectedConversationId] || [] : []),
    [attachedFilesMap, selectedConversationId],
  );

  // Fetch initial conversations list
  const refreshConversations = useCallback(async () => {
    try {
      setIsLoadingConversations(true);
      const data = await chatService.getConversations();
      setConversations(data);

      if (data.length > 0 && !selectedConversationId) {
        const targetId = urlConvId && data.some((c) => c.id === urlConvId) ? urlConvId : data[0]?.id;
        if (targetId) setSelectedConversationId(targetId);
      }
    } catch (err) {
      console.error('Failed to load conversations', err);
    } finally {
      setIsLoadingConversations(false);
    }
  }, [selectedConversationId, urlConvId]);

  useEffect(() => {
    refreshConversations();
  }, []);


  // Fetch messages and attached files when selected conversation changes
  useEffect(() => {
    if (!selectedConversationId) return;

    if (!messagesMap[selectedConversationId]) {
      const fetchMessages = async () => {
        try {
          setIsLoadingMessages(true);
          const data = await chatService.getMessages(selectedConversationId);
          setMessagesMap((prev) => ({
            ...prev,
            [selectedConversationId]: data.messages,
          }));
        } catch (err) {
          console.error('Failed to load messages', err);
        } finally {
          setIsLoadingMessages(false);
        }
      };

      fetchMessages();
    }

    const fetchAttachedFiles = async () => {
      try {
        setIsLoadingAttachedFiles(true);
        const res = await listConversationFilesApi(selectedConversationId);
        setAttachedFilesMap((prev) => ({
          ...prev,
          [selectedConversationId]: res.data || [],
        }));
      } catch (err) {
        console.error('Failed to fetch conversation files', err);
      } finally {
        setIsLoadingAttachedFiles(false);
      }
    };

    fetchAttachedFiles();
  }, [selectedConversationId]);

  // Create new conversation
  const createNewConversation = useCallback(async (title?: string): Promise<Conversation | null> => {
    try {
      const newConv = await chatService.createConversation(title);
      setConversations((prev) => [newConv, ...prev]);
      setSelectedConversationId(newConv.id);
      setMessagesMap((prev) => ({
        ...prev,
        [newConv.id]: [],
      }));
      setAttachedFilesMap((prev) => ({
        ...prev,
        [newConv.id]: [],
      }));
      return newConv;
    } catch (err) {
      console.error('Failed to create conversation', err);
      return null;
    }
  }, []);

  // Upload and attach file to active or new conversation
  const uploadAndAttachFile = useCallback(
    async (file: File, onProgress?: (progress: number) => void) => {
      let targetConvId = selectedConversationId;
      if (!targetConvId) {
        const newConv = await createNewConversation();
        if (!newConv) return null;
        targetConvId = newConv.id;
      }

      try {
        const res = await uploadConversationFileApi(targetConvId, file, onProgress);
        const updatedFilesRes = await listConversationFilesApi(targetConvId);
        setAttachedFilesMap((prev) => ({
          ...prev,
          [targetConvId!]: updatedFilesRes.data || [],
        }));

        return {
          attached: true,
          isDuplicate: res.isDuplicate || res.duplicate,
          message: res.message,
        };
      } catch (err) {
        console.error('Failed to upload and attach file', err);
        return null;
      }
    },
    [selectedConversationId, createNewConversation],
  );

  // Attach existing Knowledge Base file
  const attachExistingFile = useCallback(
    async (fileId: string) => {
      let targetConvId = selectedConversationId;
      if (!targetConvId) {
        const newConv = await createNewConversation();
        if (!newConv) return false;
        targetConvId = newConv.id;
      }

      try {
        await attachExistingFileApi(targetConvId, fileId);
        const updatedFilesRes = await listConversationFilesApi(targetConvId);
        setAttachedFilesMap((prev) => ({
          ...prev,
          [targetConvId!]: updatedFilesRes.data || [],
        }));
        return true;
      } catch (err) {
        console.error('Failed to attach existing file', err);
        return false;
      }
    },
    [selectedConversationId, createNewConversation],
  );

  // Detach file from conversation
  const detachFile = useCallback(
    async (fileId: string) => {
      if (!selectedConversationId) return false;

      try {
        setAttachedFilesMap((prev) => {
          const list = prev[selectedConversationId] || [];
          return {
            ...prev,
            [selectedConversationId]: list.filter((f) => f.fileId !== fileId && f.file?.id !== fileId),
          };
        });

        await detachConversationFileApi(selectedConversationId, fileId);
        return true;
      } catch (err) {
        console.error('Failed to detach file', err);
        const updatedFilesRes = await listConversationFilesApi(selectedConversationId);
        setAttachedFilesMap((prev) => ({
          ...prev,
          [selectedConversationId]: updatedFilesRes.data || [],
        }));
        return false;
      }
    },
    [selectedConversationId],
  );

  // Select conversation handler
  const selectConversation = useCallback((id: string | null) => {
    setSelectedConversationId(id);
    setGenerationError(null);
  }, []);

  // Clear generation error
  const clearGenerationError = useCallback(() => {
    setGenerationError(null);
  }, []);

  // Cancel generation handler
  const cancelGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
    setIsStreaming(false);
    setIsSendingMessage(false);
  }, []);

  // Rename conversation
  const renameConversation = useCallback(
    async (id: string, title: string) => {
      const oldConversations = conversations;
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title: title.trim() } : c)),
      );

      try {
        const updated = await chatService.renameConversation(id, title);
        setConversations((prev) => prev.map((c) => (c.id === id ? updated : c)));
      } catch (err) {
        console.error('Failed to rename conversation', err);
        setConversations(oldConversations);
      }
    },
    [conversations],
  );

  // Delete conversation & fallback selection
  const deleteConversation = useCallback(
    async (id: string) => {
      const oldConversations = conversations;
      const filtered = conversations.filter((c) => c.id !== id);

      setConversations(filtered);

      if (selectedConversationId === id) {
        const nextActive = filtered.length > 0 && filtered[0]?.id ? filtered[0].id : null;
        setSelectedConversationId(nextActive);
      }

      try {
        await chatService.deleteConversation(id);
        setMessagesMap((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
        setAttachedFilesMap((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      } catch (err) {
        console.error('Failed to delete conversation', err);
        setConversations(oldConversations);
        setSelectedConversationId(id);
      }
    },
    [conversations, selectedConversationId],
  );

  // Update message (content or metadata/ratings)
  const updateMessage = useCallback(
    async (
      messageId: string,
      updates: { content?: string; metadata?: Record<string, unknown> },
    ) => {
      if (!selectedConversationId) return;

      setMessagesMap((prev) => {
        const list = prev[selectedConversationId] || [];
        return {
          ...prev,
          [selectedConversationId]: list.map((m) =>
            m.id === messageId ? { ...m, ...updates } : m,
          ),
        };
      });

      try {
        await chatService.updateMessage(selectedConversationId, messageId, updates);
      } catch (err) {
        console.error('Failed to update message', err);
      }
    },
    [selectedConversationId],
  );

  // Delete specific message
  const deleteMessage = useCallback(
    async (messageId: string) => {
      if (!selectedConversationId) return;

      setMessagesMap((prev) => {
        const list = prev[selectedConversationId] || [];
        return {
          ...prev,
          [selectedConversationId]: list.filter((m) => m.id !== messageId),
        };
      });

      try {
        await chatService.deleteMessage(selectedConversationId, messageId);
      } catch (err) {
        console.error('Failed to delete message', err);
      }
    },
    [selectedConversationId],
  );

  // Regenerate assistant response for current conversation
  const regenerateResponse = useCallback(async () => {
    if (!selectedConversationId || isGenerating) return;

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const tempAssistantMessageId = `temp-assistant-${Date.now()}`;
    const tempAssistantMessage: Message = {
      id: tempAssistantMessageId,
      conversationId: selectedConversationId,
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
    };

    setGenerationError(null);
    setIsGenerating(true);
    setIsStreaming(true);

    // Filter out trailing assistant message and append temp assistant message
    setMessagesMap((prev) => {
      const list = (prev[selectedConversationId] || []).filter(
        (m, idx, arr) => !(idx === arr.length - 1 && m.role === 'assistant'),
      );
      return {
        ...prev,
        [selectedConversationId]: [...list, tempAssistantMessage],
      };
    });

    try {
      const { assistantMessage } = await chatService.regenerateStreamMessage(
        selectedConversationId,
        (chunk) => {
          setMessagesMap((prev) => {
            const list = prev[selectedConversationId] || [];
            return {
              ...prev,
              [selectedConversationId]: list.map((m) =>
                m.id === tempAssistantMessageId ? { ...m, content: m.content + chunk } : m,
              ),
            };
          });
        },
        abortController.signal,
      );

      if (assistantMessage) {
        setMessagesMap((prev) => {
          const list = prev[selectedConversationId] || [];
          return {
            ...prev,
            [selectedConversationId]: list.map((m) =>
              m.id === tempAssistantMessageId ? assistantMessage : m,
            ),
          };
        });
      }
    } catch (err: unknown) {
      if (abortController.signal.aborted) return;
      console.error('Failed to regenerate response', err);
      const errObj = err as { message?: string };
      setGenerationError(errObj.message || 'Failed to regenerate response.');
    } finally {
      setIsGenerating(false);
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [selectedConversationId, isGenerating]);

  // Edit user prompt and submit to regenerate AI response
  const editUserMessageAndSubmit = useCallback(
    async (messageId: string, newContent: string) => {
      if (!selectedConversationId || !newContent.trim()) return;

      await updateMessage(messageId, { content: newContent.trim() });
      await regenerateResponse();
    },
    [selectedConversationId, updateMessage, regenerateResponse],
  );

  // Send message — Streamed SSE request flow
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      let targetConvId = selectedConversationId;

      if (!targetConvId) {
        const newConv = await createNewConversation();
        if (!newConv) return;
        targetConvId = newConv.id;
      }

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      const tempUserMessageId = `temp-user-${Date.now()}`;
      const tempAssistantMessageId = `temp-assistant-${Date.now()}`;

      const tempUserMessage: Message = {
        id: tempUserMessageId,
        conversationId: targetConvId,
        role: 'user',
        content: content.trim(),
        createdAt: new Date().toISOString(),
      };

      const tempAssistantMessage: Message = {
        id: tempAssistantMessageId,
        conversationId: targetConvId,
        role: 'assistant',
        content: '',
        createdAt: new Date().toISOString(),
      };

      setGenerationError(null);

      setMessagesMap((prev) => ({
        ...prev,
        [targetConvId!]: [
          ...(prev[targetConvId!] || []),
          tempUserMessage,
          tempAssistantMessage,
        ],
      }));

      setConversations((prev) =>
        prev
          .map((c) => (c.id === targetConvId ? { ...c, updatedAt: new Date().toISOString() } : c))
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
      );

      setIsSendingMessage(true);
      setIsGenerating(true);
      setIsStreaming(true);

      try {
        const { assistantMessage } = await chatService.streamUserMessage(
          targetConvId,
          content.trim(),
          (chunk) => {
            setMessagesMap((prev) => {
              const list = prev[targetConvId!] || [];
              return {
                ...prev,
                [targetConvId!]: list.map((m) =>
                  m.id === tempAssistantMessageId ? { ...m, content: m.content + chunk } : m,
                ),
              };
            });
          },
          (userMessage) => {
            setMessagesMap((prev) => {
              const list = prev[targetConvId!] || [];
              return {
                ...prev,
                [targetConvId!]: list.map((m) =>
                  m.id === tempUserMessageId ? userMessage : m,
                ),
              };
            });
          },
          abortController.signal,
        );

        if (assistantMessage) {
          setMessagesMap((prev) => {
            const list = prev[targetConvId!] || [];
            return {
              ...prev,
              [targetConvId!]: list.map((m) =>
                m.id === tempAssistantMessageId ? assistantMessage : m,
              ),
            };
          });
        }
      } catch (err: unknown) {
        if (abortController.signal.aborted) {
          console.log('Stream generation cancelled by user.');
          return;
        }

        console.error('Failed to stream AI response', err);

        try {
          const freshData = await chatService.getMessages(targetConvId);
          setMessagesMap((prev) => ({
            ...prev,
            [targetConvId!]: freshData.messages,
          }));
        } catch {
          // Fallback
        }

        const errObj = err as { message?: string };
        setGenerationError(errObj.message || 'Failed to stream response. Please try again.');
      } finally {
        setIsSendingMessage(false);
        setIsGenerating(false);
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [selectedConversationId, createNewConversation],
  );

  return (
    <ChatContext.Provider
      value={{
        conversations,
        selectedConversationId,
        selectedConversation,
        messages: messagesMap,
        currentMessages,
        attachedFiles,
        isLoadingConversations,
        isLoadingMessages,
        isLoadingAttachedFiles,
        isSendingMessage,
        isGenerating,
        isStreaming,
        generationError,
        selectConversation,
        createNewConversation,
        renameConversation,
        deleteConversation,
        sendMessage,
        cancelGeneration,
        refreshConversations,
        clearGenerationError,
        uploadAndAttachFile,
        attachExistingFile,
        detachFile,
        updateMessage,
        deleteMessage,
        regenerateResponse,
        editUserMessageAndSubmit,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};


export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
