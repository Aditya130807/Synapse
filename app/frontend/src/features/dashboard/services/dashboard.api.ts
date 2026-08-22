import api from '@/lib/api';

export interface DashboardStatsResponse {
  totalConversations: number;
  totalFiles: number;
  totalSizeBytes: number;
  activeMemoriesCount: number;
  availableModelsCount: number;
  models: Array<{ name: string; id: string; provider: string }>;
  recentActivity: Array<{
    id: string;
    type: 'conversation' | 'file' | 'memory';
    title: string;
    subtitle?: string;
    timestamp: string;
    link: string;
  }>;
}

export async function getDashboardStatsApi(): Promise<DashboardStatsResponse> {
  const res = await api.get<DashboardStatsResponse>('/dashboard/stats');
  return res.data;
}
