import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  History,
  Files,
  LayoutDashboard,
  Settings,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const NavigationRail: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const location = useLocation();

  const navItems = [
    { label: 'AI Chat', path: '/chat', icon: MessageSquare },
    { label: 'History', path: '/history', icon: History },
    { label: 'Knowledge', path: '/files', icon: Files },
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  ];


  const bottomItems = [
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <motion.aside
      initial={false}
      animate={{ width: isExpanded ? 250 : 72 }}
      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      className="relative z-40 flex h-screen flex-col border-r border-white/[0.06] bg-[#040711]/95 backdrop-blur-2xl py-4 select-none shrink-0 overflow-hidden shadow-[20px_0_40px_rgba(0,0,0,0.5)]"
    >
      {/* Top Brand Logo Tile */}
      <div className="flex h-12 items-center px-4 mb-6">
        <Link
          to="/chat"
          className="flex items-center gap-3.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-xl"
        >
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-b from-blue-500 via-blue-600 to-indigo-600 text-white shadow-[0_0_24px_rgba(59,130,246,0.35)] ring-1 ring-white/20 transition-all duration-200 group-hover:scale-105">
            <Sparkles className="h-4 w-4 text-white drop-shadow" />
          </div>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.18 }}
                className="flex flex-col leading-none whitespace-nowrap"
              >
                <span className="text-sm font-bold text-white tracking-tight">
                  Synapse
                </span>
                <span className="text-[10px] text-blue-400/90 font-medium tracking-wide mt-0.5">
                  AI OS v1.0
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* Navigation Items List */}
      <nav className="flex-1 space-y-1.5 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'group relative flex h-10 items-center rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
                isExpanded ? 'px-3.5 gap-3' : 'justify-center px-0',
                isActive
                  ? 'bg-gradient-to-r from-blue-500/15 via-indigo-500/08 to-transparent border border-blue-500/35 text-white shadow-[0_0_16px_rgba(59,130,246,0.18)] font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
              )}
              title={!isExpanded ? item.label : undefined}
            >
              {isActive && (
                <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[#3B82F6] shadow-[0_0_12px_#3B82F6]" />
              )}
              <Icon
                className={cn(
                  'h-4.5 w-4.5 shrink-0 transition-colors',
                  isActive ? 'text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'text-slate-400 group-hover:text-slate-200'
                )}
              />
              <AnimatePresence>
                {isExpanded && (
                  <motion.span
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6 }}
                    transition={{ duration: 0.15 }}
                    className="text-[13px] font-medium tracking-tight whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Nav & Desktop Version Card */}
      <div className="px-3 pt-2 space-y-2.5">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'group relative flex h-10 items-center rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
                isExpanded ? 'px-3.5 gap-3' : 'justify-center px-0',
                isActive
                  ? 'bg-blue-500/15 border border-blue-500/30 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
              )}
              title={!isExpanded ? item.label : undefined}
            >
              <Icon className="h-4.5 w-4.5 shrink-0 text-slate-400 group-hover:text-slate-200" />
              <AnimatePresence>
                {isExpanded && (
                  <motion.span
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6 }}
                    transition={{ duration: 0.15 }}
                    className="text-[13px] font-medium tracking-tight whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}

        {/* Version Badge Card */}
        <div className="pt-2">
          {isExpanded ? (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-white/[0.08] bg-[#0A0F1D]/80 backdrop-blur-xl p-3 text-xs text-slate-400 shadow-2xl"
            >
              <div className="font-semibold text-white mb-0.5 flex items-center justify-between">
                <span className="text-[12px] tracking-tight">Synapse v1.0 Shell</span>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-normal">Sprint 3 Workspace Layout</div>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center py-2 px-1 rounded-xl border border-white/[0.06] bg-[#0A0F1D]/60 text-[10px] text-slate-400">
              <span className="font-mono text-slate-300 font-semibold">v1.0</span>
              <span className="relative flex h-2 w-2 mt-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.aside>
  );
};
