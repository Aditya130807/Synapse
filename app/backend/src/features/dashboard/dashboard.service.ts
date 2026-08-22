import prisma from '../../lib/prisma.js';

export interface DashboardStats {
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
    timestamp: Date;
    link: string;
  }>;
}

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  // Fetch conversation count & recent conversations
  const [conversationsCount, recentConversations] = await Promise.all([
    prisma.conversation.count({
      where: { userId, status: 'active' },
    }),
    prisma.conversation.findMany({
      where: { userId, status: 'active' },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        updatedAt: true,
        _count: { select: { messages: true } },
      },
    }),
  ]);

  // Fetch files count & recent files
  const [filesCount, filesSizeAggregate, recentFiles] = await Promise.all([
    prisma.knowledgeFile.count({
      where: { userId },
    }),
    prisma.knowledgeFile.aggregate({
      where: { userId },
      _sum: { size: true },
    }),
    prisma.knowledgeFile.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        filename: true,
        extension: true,
        createdAt: true,
      },
    }),
  ]);

  // Fetch active persistent memory count & recent memories
  const [memoriesCount, recentMemories] = await Promise.all([
    prisma.persistentMemory.count({
      where: { userId, status: 'ACTIVE' },
    }),
    prisma.persistentMemory.findMany({
      where: { userId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        content: true,
        scope: true,
        type: true,
        createdAt: true,
      },
    }),
  ]);

  // Available AI models
  const models = [
    { name: 'Gemini 2.5 Flash', id: 'gemini-2.5-flash', provider: 'Google AI' },
    { name: 'Gemini 2.5 Pro', id: 'gemini-2.5-pro', provider: 'Google AI' },
    { name: 'Claude 3.5 Sonnet', id: 'claude-3-5-sonnet', provider: 'Anthropic' },
    { name: 'GPT-4o', id: 'gpt-4o', provider: 'OpenAI' },
    { name: 'DeepSeek R1', id: 'deepseek-r1', provider: 'DeepSeek' },
    { name: 'Qwen 2.5 Coder', id: 'qwen-2.5-coder', provider: 'Alibaba Cloud' },
  ];

  // Merge recent activity timeline
  const activityItems: DashboardStats['recentActivity'] = [
    ...recentConversations.map((c) => ({
      id: `conv-${c.id}`,
      type: 'conversation' as const,
      title: c.title || 'Untitled Conversation',
      subtitle: `${c._count.messages} message${c._count.messages === 1 ? '' : 's'}`,
      timestamp: c.updatedAt,
      link: `/chat?id=${c.id}`,
    })),
    ...recentFiles.map((f) => ({
      id: `file-${f.id}`,
      type: 'file' as const,
      title: f.filename,
      subtitle: `Uploaded document (.${f.extension})`,
      timestamp: f.createdAt,
      link: '/files',
    })),
    ...recentMemories.map((m) => ({
      id: `mem-${m.id}`,
      type: 'memory' as const,
      title: m.content.length > 60 ? m.content.slice(0, 60) + '...' : m.content,
      subtitle: `${m.scope} ${m.type.toLowerCase()}`,
      timestamp: m.createdAt,
      link: '/chat',
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 8);

  return {
    totalConversations: conversationsCount,
    totalFiles: filesCount,
    totalSizeBytes: filesSizeAggregate._sum.size || 0,
    activeMemoriesCount: memoriesCount,
    availableModelsCount: models.length,
    models,
    recentActivity: activityItems,
  };
}
