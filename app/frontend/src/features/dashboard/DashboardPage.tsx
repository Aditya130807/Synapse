import { Link } from 'react-router-dom';
import { motion, Variants } from 'framer-motion';
import {
  MessageSquare,
  Files,
  History,
  Settings,
  Sparkles,
  ArrowRight,
  Database,
  Bot,
  Activity,
  FolderKanban,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/features/auth';

export default function DashboardPage() {
  const { user } = useAuth();
  const userName = user?.name ? user.name.split(' ')[0] : undefined;

  const quickActions = [
    {
      title: 'Start AI Chat',
      description: 'Begin a new conversation with Synapse AI',
      icon: MessageSquare,
      path: '/chat',
      color: 'text-[#3B82F6] bg-[#3B82F6]/10 border-[#3B82F6]/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_0_12px_rgba(59,130,246,0.15)]',
    },
    {
      title: 'Upload Files',
      description: 'Add documents to your knowledge base',
      icon: Files,
      path: '/files',
      color: 'text-[#22C55E] bg-[#22C55E]/10 border-[#22C55E]/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_0_12px_rgba(34,197,94,0.15)]',
    },
    {
      title: 'Browse History',
      description: 'View previous chats and generated outputs',
      icon: History,
      path: '/history',
      color: 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_0_12px_rgba(245,158,11,0.15)]',
    },
    {
      title: 'Workspace Settings',
      description: 'Configure workspace parameters',
      icon: Settings,
      path: '/settings',
      color: 'text-[#A855F7] bg-[#A855F7]/10 border-[#A855F7]/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_0_12px_rgba(168,85,247,0.15)]',
    },
  ];

  // Framer Motion Staggered Entrance Variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.05,
      },
    },
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 14 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.45,
        ease: 'easeOut',
      },
    },
  };

  return (
    <div className="space-y-9 pb-12">
      {/* Premium AI OS Hero Banner - Refactored with 9.8/10 Linear Polish */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-[24px] border-t border-t-white/[0.18] border-x border-x-white/[0.08] border-b border-b-white/[0.04] bg-[rgba(15,23,42,0.82)] p-8 sm:p-10 md:p-12 backdrop-blur-2xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12),0_24px_48px_-12px_rgba(0,0,0,0.8),0_0_40px_rgba(59,130,246,0.12)]"
      >
        {/* Layer 1: Radial Blue Gradient Glow Top-Left */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-[#3B82F6]/20 blur-[100px]" />

        {/* Layer 2: Purple Glow Bottom-Right */}
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-[#A855F7]/20 blur-[110px]" />

        {/* Layer 3: Subtle Background Twinkling Stars */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-60">
          <div className="absolute top-1/4 left-1/5 h-1 w-1 rounded-full bg-blue-300 animate-ping opacity-75" />
          <div className="absolute top-1/3 left-2/3 h-1.5 w-1.5 rounded-full bg-indigo-200 animate-pulse opacity-80" />
          <div className="absolute bottom-1/3 left-1/2 h-1 w-1 rounded-full bg-cyan-200 animate-pulse opacity-60" />
          <div className="absolute top-1/2 right-1/4 h-1 w-1 rounded-full bg-purple-300 animate-ping opacity-50" />
        </div>

        {/* Layer 4: Decorative Wave SVG Graphic on Right */}
        <div className="pointer-events-none absolute top-0 bottom-0 right-0 w-full sm:w-2/3 md:w-1/2 opacity-50 mix-blend-screen overflow-hidden">
          <svg className="w-full h-full" viewBox="0 0 600 240" fill="none" preserveAspectRatio="none">
            <circle cx="480" cy="120" r="140" fill="url(#hero-radial-glow)" />

            <path
              d="M-50,210 C150,110 320,240 480,120 C540,75 580,130 650,80"
              stroke="url(#hero-wave-grad-1)"
              strokeWidth="2.5"
              fill="none"
              className="drop-shadow-[0_0_12px_rgba(59,130,246,0.6)]"
            />
            <path
              d="M0,180 C180,90 350,210 500,100 C560,55 600,110 650,60"
              stroke="url(#hero-wave-grad-2)"
              strokeWidth="1.8"
              fill="none"
              className="drop-shadow-[0_0_8px_rgba(59,130,246,0.4)]"
            />
            <path
              d="M100,240 C250,140 400,230 520,130 C580,80 620,140 650,90"
              stroke="url(#hero-wave-grad-3)"
              strokeWidth="1.2"
              fill="none"
              strokeDasharray="4 4"
            />

            <defs>
              <radialGradient id="hero-radial-glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(480 120) rotate(90) scale(140)">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />
                <stop offset="60%" stopColor="#2563EB" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#020617" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="hero-wave-grad-1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.1" />
                <stop offset="40%" stopColor="#2563EB" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#A855F7" stopOpacity="0.95" />
              </linearGradient>
              <linearGradient id="hero-wave-grad-2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.2" />
                <stop offset="60%" stopColor="#3B82F6" stopOpacity="0.75" />
                <stop offset="100%" stopColor="#A855F7" stopOpacity="0.85" />
              </linearGradient>
              <linearGradient id="hero-wave-grad-3" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.5" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Foreground Content */}
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#3B82F6]/30 bg-gradient-to-r from-[#3B82F6]/15 to-[#2563EB]/15 px-3.5 py-1.5 text-xs font-semibold text-[#3B82F6] shadow-[0_0_15px_rgba(59,130,246,0.2)] backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-[#3B82F6]" />
            <span>Workspace Overview</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-[36px] font-extrabold tracking-tight text-[#F8FAFC] leading-tight">
            {userName ? `Welcome back, ${userName}` : 'Welcome to Synapse'}
          </h1>

          <p className="text-sm sm:text-base text-[#CBD5E1] max-w-xl leading-relaxed font-normal">
            Your AI Workspace for intelligence, context analysis, and developer workflows.
          </p>
        </div>
      </motion.div>

      {/* Quick Actions Grid - Refactored with 9.8/10 Linear Polish */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold tracking-tight text-[#F8FAFC] flex items-center gap-2">
            <span>Quick Actions</span>
          </h2>
        </div>
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
                  <Card className="h-full rounded-[16px] border-t border-t-white/[0.14] border-x border-x-white/[0.06] border-b border-b-white/[0.03] bg-[rgba(15,23,42,0.82)] backdrop-blur-xl transition-all duration-300 ease-out hover:-translate-y-1.5 hover:bg-[rgba(20,30,50,0.92)] hover:border-[#3B82F6]/40 hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15),0_12px_32px_-8px_rgba(59,130,246,0.25),0_0_0_1px_rgba(59,130,246,0.2)] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_8px_24px_-8px_rgba(0,0,0,0.6)]">
                    <CardHeader className="p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${action.color} group-hover:scale-[1.08] transition-transform duration-300 ease-out`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <ArrowRight className="h-4 w-4 text-[#94A3B8] group-hover:text-[#3B82F6] group-hover:translate-x-1 transition-all duration-300" />
                      </div>
                      <div className="space-y-1">
                        <CardTitle className="text-[15px] font-semibold text-[#F8FAFC] group-hover:text-[#3B82F6] transition-colors duration-200">
                          {action.title}
                        </CardTitle>
                        <CardDescription className="text-[12px] text-[#94A3B8] leading-relaxed font-normal">
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

      {/* Workspace Overview Section - Refactored with 9.8/10 Linear Polish */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold tracking-tight text-[#F8FAFC]">Workspace Overview</h2>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-4"
        >
          {/* Card 1: Chats */}
          <motion.div variants={cardVariants}>
            <Card className="group relative overflow-hidden rounded-[16px] border-t border-t-white/[0.14] border-x border-x-white/[0.06] border-b border-b-white/[0.03] bg-[rgba(15,23,42,0.82)] backdrop-blur-xl p-6 transition-all duration-300 ease-out hover:-translate-y-1.5 hover:bg-[rgba(20,30,50,0.92)] hover:border-[#3B82F6]/40 hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15),0_12px_32px_-8px_rgba(59,130,246,0.25),0_0_0_1px_rgba(59,130,246,0.2)] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_8px_24px_-8px_rgba(0,0,0,0.6)]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_0_12px_rgba(59,130,246,0.15)] group-hover:scale-[1.08] transition-transform duration-300 ease-out">
                    <Bot className="h-4.5 w-4.5" />
                  </div>
                  <span className="text-xs font-semibold text-[#CBD5E1]">Chats</span>
                </div>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-2xl font-bold text-[#F8FAFC] tracking-tight">24</div>
                  <div className="text-[11px] text-[#94A3B8] mt-0.5">Total conversations</div>
                </div>
                {/* Sparkline Curve */}
                <div className="w-20 h-8 opacity-75 group-hover:opacity-100 transition-opacity duration-300">
                  <svg className="w-full h-full" viewBox="0 0 80 30" fill="none">
                    <path
                      d="M0,25 C15,20 25,28 40,15 C55,2 65,18 80,10"
                      stroke="#3B82F6"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Card 2: Files */}
          <motion.div variants={cardVariants}>
            <Card className="group relative overflow-hidden rounded-[16px] border-t border-t-white/[0.14] border-x border-x-white/[0.06] border-b border-b-white/[0.03] bg-[rgba(15,23,42,0.82)] backdrop-blur-xl p-6 transition-all duration-300 ease-out hover:-translate-y-1.5 hover:bg-[rgba(20,30,50,0.92)] hover:border-[#22C55E]/40 hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15),0_12px_32px_-8px_rgba(34,197,94,0.25),0_0_0_1px_rgba(34,197,94,0.2)] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_8px_24px_-8px_rgba(0,0,0,0.6)]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_0_12px_rgba(34,197,94,0.15)] group-hover:scale-[1.08] transition-transform duration-300 ease-out">
                    <FolderKanban className="h-4.5 w-4.5" />
                  </div>
                  <span className="text-xs font-semibold text-[#CBD5E1]">Files</span>
                </div>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-2xl font-bold text-[#F8FAFC] tracking-tight">18</div>
                  <div className="text-[11px] text-[#94A3B8] mt-0.5">Documents uploaded</div>
                </div>
                {/* Sparkline Curve */}
                <div className="w-20 h-8 opacity-75 group-hover:opacity-100 transition-opacity duration-300">
                  <svg className="w-full h-full" viewBox="0 0 80 30" fill="none">
                    <path
                      d="M0,22 C15,25 30,12 45,18 C60,24 70,8 80,4"
                      stroke="#22C55E"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Card 3: AI Models */}
          <motion.div variants={cardVariants}>
            <Card className="group relative overflow-hidden rounded-[16px] border-t border-t-white/[0.14] border-x border-x-white/[0.06] border-b border-b-white/[0.03] bg-[rgba(15,23,42,0.82)] backdrop-blur-xl p-6 transition-all duration-300 ease-out hover:-translate-y-1.5 hover:bg-[rgba(20,30,50,0.92)] hover:border-[#A855F7]/40 hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15),0_12px_32px_-8px_rgba(168,85,247,0.25),0_0_0_1px_rgba(168,85,247,0.2)] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_8px_24px_-8px_rgba(0,0,0,0.6)]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#A855F7]/10 text-[#A855F7] border border-[#A855F7]/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_0_12px_rgba(168,85,247,0.15)] group-hover:scale-[1.08] transition-transform duration-300 ease-out">
                    <Sparkles className="h-4.5 w-4.5" />
                  </div>
                  <span className="text-xs font-semibold text-[#CBD5E1]">AI Models</span>
                </div>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-2xl font-bold text-[#F8FAFC] tracking-tight">6</div>
                  <div className="text-[11px] text-[#94A3B8] mt-0.5">Models available</div>
                </div>
                {/* Sparkline Curve */}
                <div className="w-20 h-8 opacity-75 group-hover:opacity-100 transition-opacity duration-300">
                  <svg className="w-full h-full" viewBox="0 0 80 30" fill="none">
                    <path
                      d="M0,28 C20,18 35,22 50,10 C65,-2 72,12 80,6"
                      stroke="#A855F7"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Card 4: Workspace */}
          <motion.div variants={cardVariants}>
            <Card className="group relative overflow-hidden rounded-[16px] border-t border-t-white/[0.14] border-x border-x-white/[0.06] border-b border-b-white/[0.03] bg-[rgba(15,23,42,0.82)] backdrop-blur-xl p-6 transition-all duration-300 ease-out hover:-translate-y-1.5 hover:bg-[rgba(20,30,50,0.92)] hover:border-[#3B82F6]/40 hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15),0_12px_32px_-8px_rgba(59,130,246,0.25),0_0_0_1px_rgba(59,130,246,0.2)] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_8px_24px_-8px_rgba(0,0,0,0.6)]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_0_12px_rgba(59,130,246,0.15)] group-hover:scale-[1.08] transition-transform duration-300 ease-out">
                    <Database className="h-4.5 w-4.5" />
                  </div>
                  <span className="text-xs font-semibold text-[#CBD5E1]">Workspace</span>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full border border-[#22C55E]/30 bg-[#22C55E]/10 px-2 py-0.5 text-[10px] font-semibold text-[#22C55E] shadow-[0_0_10px_rgba(34,197,94,0.15)]">
                  <CheckCircle2 className="h-3 w-3" />
                  Active
                </span>
              </div>
              <div className="space-y-0.5">
                <div className="text-base font-bold text-[#F8FAFC] tracking-tight">Synapse Workspace</div>
                <p className="text-[11px] text-[#94A3B8]">Your active workspace</p>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      </div>

      {/* Recent Activity Section - Refactored with 9.8/10 Linear Polish */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="space-y-4"
      >
        <h2 className="text-base font-semibold tracking-tight text-[#F8FAFC]">Recent Activity</h2>
        <Card className="rounded-[16px] border-t border-t-white/[0.14] border-x border-x-white/[0.06] border-b border-b-white/[0.03] bg-[rgba(15,23,42,0.82)] backdrop-blur-xl p-8 text-center shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_8px_24px_-8px_rgba(0,0,0,0.6)]">
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] text-[#94A3B8] border border-[rgba(255,255,255,0.06)] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]">
              <Activity className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-[#F8FAFC]">No recent activity yet</p>
              <p className="text-xs text-[#94A3B8] max-w-sm">
                Your recent AI interactions, chats, and uploaded files will appear here.
              </p>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
