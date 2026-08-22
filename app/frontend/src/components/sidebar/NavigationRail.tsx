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
      className="relative z-40 flex h-screen flex-col border-r py-4 select-none shrink-0 overflow-hidden backdrop-blur-2xl transition-colors duration-200"
      style={{
        backgroundColor: 'var(--sidebar)',
        borderColor: 'var(--sidebar-border)',
        boxShadow: '4px 0 20px rgba(0,0,0,0.05)',
      }}
    >
      {/* Brand Logo */}
      <div className="flex h-12 items-center px-4 mb-6">
        <Link
          to="/chat"
          className="flex items-center gap-3.5 group focus-visible:outline-none focus-visible:ring-2 rounded-xl"
          style={{ '--tw-ring-color': 'var(--primary)' } as React.CSSProperties}
        >
          <div
            className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all duration-200 group-hover:scale-105"
            style={{
              backgroundColor: 'var(--primary-muted)',
              borderColor: 'var(--primary-border)',
              color: 'var(--primary)',
            }}
          >
            <Sparkles className="h-4 w-4" style={{ color: 'var(--primary)' }} />
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
                <span className="text-sm font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  Synapse
                </span>
                <span className="text-[10px] font-medium tracking-wide mt-0.5" style={{ color: 'var(--primary)', opacity: 0.85 }}>
                  AI Workspace
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 space-y-1.5 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'group relative flex h-10 items-center rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2',
                isExpanded ? 'px-3.5 gap-3' : 'justify-center px-0'
              )}
              style={
                isActive
                  ? {
                      backgroundColor: 'var(--nav-active-bg)',
                      border: '1px solid var(--nav-active-border)',
                      color: 'var(--text-primary)',
                      fontWeight: 600,
                    }
                  : { color: 'var(--muted)' }
              }
              title={!isExpanded ? item.label : undefined}
            >
              {isActive && (
                <div
                  className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full"
                  style={{ backgroundColor: 'var(--nav-indicator)' }}
                />
              )}
              <Icon
                className="h-[18px] w-[18px] shrink-0 transition-colors"
                style={{ color: isActive ? 'var(--nav-active-icon)' : 'var(--muted)' }}
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

      {/* Bottom Nav & Version */}
      <div className="px-3 pt-2 space-y-2.5">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'group relative flex h-10 items-center rounded-xl transition-all duration-200 focus-visible:outline-none',
                isExpanded ? 'px-3.5 gap-3' : 'justify-center px-0',
              )}
              style={
                isActive
                  ? { backgroundColor: 'var(--nav-active-bg)', border: '1px solid var(--nav-active-border)', color: 'var(--text-primary)', fontWeight: 600 }
                  : { color: 'var(--muted)' }
              }
              title={!isExpanded ? item.label : undefined}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" style={{ color: 'var(--muted)' }} />
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

        {/* Version Badge */}
        <div className="pt-2">
          {isExpanded ? (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border p-3 text-xs"
              style={{
                borderColor: 'var(--border)',
                backgroundColor: 'var(--surface-elevated)',
                color: 'var(--muted)',
              }}
            >
              <div className="font-semibold mb-0.5 flex items-center justify-between" style={{ color: 'var(--text-primary)' }}>
                <span className="text-[12px] tracking-tight">Synapse v1.0</span>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: 'var(--primary)' }} />
                  <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: 'var(--primary)' }} />
                </span>
              </div>
              <div className="text-[10px] font-normal" style={{ color: 'var(--muted)' }}>AI Workspace</div>
            </motion.div>
          ) : (
            <div
              className="flex flex-col items-center justify-center py-2 px-1 rounded-xl border text-[10px]"
              style={{
                borderColor: 'var(--border-subtle)',
                backgroundColor: 'var(--surface-elevated)',
                color: 'var(--muted)',
              }}
            >
              <span className="font-mono font-semibold" style={{ color: 'var(--text-secondary)' }}>v1.0</span>
              <span className="relative flex h-2 w-2 mt-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: 'var(--primary)' }} />
                <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: 'var(--primary)' }} />
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.aside>
  );
};
