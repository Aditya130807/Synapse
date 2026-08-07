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
