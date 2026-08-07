import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  History,
  Files,
  LayoutDashboard,
  Settings,
  X,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();

  const primaryNavItems = [
    { label: 'AI Chat', path: '/chat', icon: MessageSquare },
    { label: 'History', path: '/history', icon: History },
    { label: 'Knowledge', path: '/files', icon: Files },
  ];


  const secondaryNavItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  ];

  const bottomNavItems = [
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  const renderNavLink = (item: { label: string; path: string; icon: React.ElementType }) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.path;

    return (
      <Link
        key={item.path}
        to={item.path}
        onClick={() => onClose()}
        className={cn(
          'group relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 select-none',
          isActive ? 'text-white font-semibold' : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
        )}
      >
        {/* Animated Active Blue Glow Background & Left Indicator */}
        {isActive && (
          <>
            <motion.div
              layoutId="sidebarActiveBg"
              className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/15 via-indigo-500/10 to-transparent border border-blue-500/30 shadow-[0_0_16px_rgba(59,130,246,0.2)] pointer-events-none"
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            />
            <motion.div
              layoutId="sidebarActiveIndicator"
              className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.9)] pointer-events-none"
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            />
          </>
        )}

        <Icon
          className={cn(
            'relative z-10 h-4 w-4 shrink-0 transition-all duration-200 group-hover:scale-105',
            isActive ? 'text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]' : 'text-slate-400 group-hover:text-slate-200'
          )}
        />
        <span className="relative z-10">{item.label}</span>
      </Link>
    );
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/75 backdrop-blur-md md:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Desktop App Container */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-50 flex w-[260px] flex-col border-r border-white/[0.08] bg-[#060A14]/90 backdrop-blur-2xl px-4 py-5 transition-transform duration-300 ease-in-out md:static md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {/* Header / Logo section */}
        <div className="flex h-12 items-center justify-between px-2 mb-6">
          <Link to="/dashboard" className="flex items-center gap-3 font-bold text-white group">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-b from-blue-500/25 to-indigo-600/15 text-blue-400 border border-blue-500/35 shadow-[0_0_20px_rgba(59,130,246,0.25)] transition-transform duration-300 group-hover:scale-105">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-[16px] font-bold tracking-tight text-white group-hover:text-blue-400 transition-colors">
                Synapse
              </span>
              <span className="text-[10px] text-blue-400/80 font-medium tracking-wide mt-0.5">
                AI Workspace
              </span>
            </div>
          </Link>

          {/* Close button for mobile drawer */}
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:bg-white/[0.06] hover:text-white"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto pr-1">
          <div className="space-y-1">{primaryNavItems.map(renderNavLink)}</div>

          {/* Hairline Divider */}
          <div className="my-3.5 h-[1px] bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

          <div className="space-y-1">{secondaryNavItems.map(renderNavLink)}</div>

          {/* Hairline Divider */}
          <div className="my-3.5 h-[1px] bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

          <div className="space-y-1">{bottomNavItems.map(renderNavLink)}</div>
        </nav>

        {/* Desktop Application Version Card */}
        <div className="mt-auto pt-4">
          <div className="rounded-2xl border border-white/[0.08] bg-[#0F172A]/70 backdrop-blur-xl p-3.5 text-xs text-slate-400 shadow-[0_8px_20px_rgba(0,0,0,0.5)]">
            <div className="font-semibold text-white mb-1 flex items-center justify-between">
              <span>Synapse v1.0 Shell</span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-normal">Sprint 3 Workspace Layout</div>
          </div>
        </div>
      </aside>
    </>
  );
}
