import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, Variants } from 'framer-motion';
import {
  MessageSquare,
  Files,
  History,
  Settings,
  Sparkles,
  ArrowRight,
  Bot,
  Activity,
  FolderKanban,
  CheckCircle2,
  Brain,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/features/auth';
import { getDashboardStatsApi, type DashboardStatsResponse } from './services/dashboard.api';
import { formatRelativeTime } from '@/utils/time';
import { formatBytes } from '@/features/files/utils/fileHelpers';

export default function DashboardPage() {
  const { user } = useAuth();
  const userName = user?.name ? user.name.split(' ')[0] : undefined;

  const [stats, setStats] = useState<DashboardStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDashboardStatsApi();
      setStats(data);
    } catch (err: any) {
      console.error('Failed to load dashboard statistics:', err);
      setError('Unable to load workspace statistics. Please check your backend connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const quickActions = [
    {
      title: 'Start AI Chat',
      description: 'Begin a new conversation with Synapse AI',
      icon: MessageSquare,
      path: '/chat',
      accentColor: 'var(--primary)',
      accentMuted: 'var(--primary-muted)',
      accentBorder: 'var(--primary-border)',
    },
    {
      title: 'Knowledge Base',
      description: 'Upload & search workspace documents',
      icon: Files,
      path: '/files',
      accentColor: '#22C55E',
      accentMuted: 'rgba(34,197,94,0.12)',
      accentBorder: 'rgba(34,197,94,0.25)',
    },
    {
      title: 'Conversation History',
      description: 'Review previous chats and prompts',
      icon: History,
      path: '/history',
      accentColor: '#F59E0B',
      accentMuted: 'rgba(245,158,11,0.12)',
      accentBorder: 'rgba(245,158,11,0.25)',
    },
    {
      title: 'Workspace Settings',
      description: 'Configure account & AI preferences',
      icon: Settings,
      path: '/settings',
      accentColor: '#A855F7',
      accentMuted: 'rgba(168,85,247,0.12)',
      accentBorder: 'rgba(168,85,247,0.25)',
    },
  ];

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 14 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  };

  return (
    <div className="space-y-9 pb-12">
      {/* Hero Banner */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-[24px] border p-8 sm:p-10 md:p-12 shadow-xl"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="relative z-10 space-y-4">
          <div
            className="inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold"
            style={{
              borderColor: 'var(--primary-border)',
              backgroundColor: 'var(--primary-muted)',
              color: 'var(--primary)',
            }}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Workspace Overview</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight" style={{ color: 'var(--text-primary)' }}>
            {userName ? `Welcome back, ${userName}` : 'Welcome to Synapse'}
          </h1>

          <p className="text-sm sm:text-base max-w-xl leading-relaxed font-normal" style={{ color: 'var(--text-secondary)' }}>
            Your AI Workspace for intelligence, context analysis, and persistent developer memory.
          </p>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Quick Actions
        </h2>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-4"
        >
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <motion.div key={action.title} variants={cardVariants}>
                <Link to={action.path} className="group block h-full">
                  <Card
                    className="h-full rounded-[16px] border transition-all duration-300 ease-out hover:-translate-y-1"
                    style={{
                      backgroundColor: 'var(--card)',
                      borderColor: 'var(--border)',
                    }}
                  >
                    <CardHeader className="p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-xl border group-hover:scale-[1.08] transition-transform duration-300 ease-out"
                          style={{
                            backgroundColor: action.accentMuted,
                            borderColor: action.accentBorder,
                            color: action.accentColor,
                          }}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-all duration-300" style={{ color: 'var(--muted)' }} />
                      </div>
                      <div className="space-y-1">
                        <CardTitle className="text-[15px] font-semibold transition-colors duration-200" style={{ color: 'var(--text-primary)' }}>
                          {action.title}
                        </CardTitle>
                        <CardDescription className="text-[12px] leading-relaxed font-normal" style={{ color: 'var(--muted)' }}>
                          {action.description}
                        </CardDescription>
                      </div>
                    </CardHeader>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Live Workspace Metrics */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Workspace Metrics
          </h2>
          {error && (
            <button
              onClick={fetchStats}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-400 hover:underline cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Retry Sync
            </button>
          )}
        </div>

        {loading ? (
          <div className="grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-6 rounded-[16px] border space-y-3" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                <Skeleton className="h-9 w-9 rounded-xl" />
                <Skeleton className="h-7 w-20" />
                <Skeleton className="h-4 w-32" />
              </Card>
            ))}
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-4"
          >
            {/* Conversations Card */}
            <motion.div variants={cardVariants}>
              <Card
                className="group relative overflow-hidden rounded-[16px] border p-6 transition-all duration-300 ease-out hover:-translate-y-1"
                style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20 group-hover:scale-[1.08] transition-transform duration-300">
                      <Bot className="h-[18px] w-[18px]" />
                    </div>
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Conversations</span>
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                    {stats?.totalConversations ?? 0}
                  </div>
                  <div className="text-[11px] mt-0.5" style={{ color: 'var(--muted)' }}>Active chat sessions</div>
                </div>
              </Card>
            </motion.div>

            {/* Knowledge Files Card */}
            <motion.div variants={cardVariants}>
              <Card
                className="group relative overflow-hidden rounded-[16px] border p-6 transition-all duration-300 ease-out hover:-translate-y-1"
                style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 group-hover:scale-[1.08] transition-transform duration-300">
                      <FolderKanban className="h-[18px] w-[18px]" />
                    </div>
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Knowledge Base</span>
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                    {stats?.totalFiles ?? 0}
                  </div>
                  <div className="text-[11px] mt-0.5" style={{ color: 'var(--muted)' }}>
                    {stats?.totalSizeBytes ? formatBytes(stats.totalSizeBytes) : '0 B'} stored
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Active Memories Card */}
            <motion.div variants={cardVariants}>
              <Card
                className="group relative overflow-hidden rounded-[16px] border p-6 transition-all duration-300 ease-out hover:-translate-y-1"
                style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-xl border group-hover:scale-[1.08] transition-transform duration-300"
                      style={{
                        backgroundColor: 'var(--primary-muted)',
                        borderColor: 'var(--primary-border)',
                        color: 'var(--primary)',
                      }}
                    >
                      <Brain className="h-[18px] w-[18px]" />
                    </div>
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Persistent Memory</span>
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                    {stats?.activeMemoriesCount ?? 0}
                  </div>
                  <div className="text-[11px] mt-0.5" style={{ color: 'var(--muted)' }}>Active rules & preferences</div>
                </div>
              </Card>
            </motion.div>

            {/* AI Models Card */}
            <motion.div variants={cardVariants}>
              <Card
                className="group relative overflow-hidden rounded-[16px] border p-6 transition-all duration-300 ease-out hover:-translate-y-1"
                style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/20 group-hover:scale-[1.08] transition-transform duration-300">
                      <Sparkles className="h-[18px] w-[18px]" />
                    </div>
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>AI Engine</span>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-500">
                    <CheckCircle2 className="h-3 w-3" />
                    Online
                  </span>
                </div>
                <div>
                  <div className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                    {stats?.availableModelsCount ?? 6}
                  </div>
                  <div className="text-[11px] mt-0.5" style={{ color: 'var(--muted)' }}>Multi-agent models ready</div>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* Real Activity Stream */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="space-y-4"
      >
        <h2 className="text-base font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Recent Workspace Activity
        </h2>

        {loading ? (
          <Card className="rounded-[16px] border p-6 space-y-3" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-5 w-64" />
            <Skeleton className="h-5 w-56" />
          </Card>
        ) : !stats?.recentActivity || stats.recentActivity.length === 0 ? (
          <Card
            className="rounded-[16px] border p-8 text-center"
            style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
          >
            <div className="flex flex-col items-center justify-center space-y-3">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl border"
                style={{
                  backgroundColor: 'var(--surface-elevated)',
                  borderColor: 'var(--border)',
                  color: 'var(--muted)',
                }}
              >
                <Activity className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>No recent activity yet</p>
                <p className="text-xs max-w-sm" style={{ color: 'var(--muted)' }}>
                  Start a chat or upload documents to see live workspace activity logs here.
                </p>
              </div>
            </div>
          </Card>
        ) : (
          <Card
            className="rounded-[16px] border divide-y overflow-hidden shadow-xs"
            style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
          >
            {stats.recentActivity.map((act) => (
              <Link
                key={act.id}
                to={act.link}
                className="flex items-center justify-between p-4 transition-colors hover:bg-[var(--surface-hover)] group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-xl border shrink-0"
                    style={
                      act.type === 'conversation'
                        ? { backgroundColor: 'rgba(59,130,246,0.1)', borderColor: 'rgba(59,130,246,0.2)', color: '#3B82F6' }
                        : act.type === 'file'
                        ? { backgroundColor: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.2)', color: '#22C55E' }
                        : { backgroundColor: 'var(--primary-muted)', borderColor: 'var(--primary-border)', color: 'var(--primary)' }
                    }
                  >
                    {act.type === 'conversation' && <MessageSquare className="h-4 w-4" />}
                    {act.type === 'file' && <Files className="h-4 w-4" />}
                    {act.type === 'memory' && <Brain className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate group-hover:text-[var(--primary)] transition-colors" style={{ color: 'var(--text-primary)' }}>
                      {act.title}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>
                      {act.subtitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs shrink-0 pl-3" style={{ color: 'var(--muted)' }}>
                  <Clock className="h-3.5 w-3.5" />
                  <span>{formatRelativeTime(act.timestamp)}</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </Card>
        )}
      </motion.div>
    </div>
  );
}
