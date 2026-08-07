import api from '@/lib/api';

export interface SemanticSearchResultItem {
  id: string;
  chunkId: string;
  fileId: string;
  filename: string;
  page?: number | null;
  chunkIndex: number;
  score: number;
  scorePercent: number;
  content: string;
  tokenEstimate?: number;
}

export interface SemanticSearchResponse {
  status: string;
  data: {
    query: string;
    totalResults: number;
    results: SemanticSearchResultItem[];
  };
}

export async function searchSemanticApi(query: string, limit = 10): Promise<SemanticSearchResponse> {
  const response = await api.post<SemanticSearchResponse>('/search/semantic', { query, limit });
  return response.data;
}

export async function searchConversationApi(conversationId: string, query: string, limit = 10): Promise<SemanticSearchResponse> {
  const response = await api.post<SemanticSearchResponse>('/search/conversation', { conversationId, query, limit });
  return response.data;
}
