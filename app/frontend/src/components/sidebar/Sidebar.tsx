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
          isActive ? 'font-semibold' : ''
        )}
        style={
          isActive
            ? { color: 'var(--text-primary)' }
            : { color: 'var(--muted)' }
        }
      >
        {/* Animated Active Background & Left Indicator */}
        {isActive && (
          <>
            <motion.div
              layoutId="sidebarActiveBg"
              className="absolute inset-0 rounded-xl pointer-events-none border"
              style={{
                backgroundColor: 'var(--nav-active-bg)',
                borderColor: 'var(--nav-active-border)',
              }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            />
            <motion.div
              layoutId="sidebarActiveIndicator"
              className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full pointer-events-none"
              style={{ backgroundColor: 'var(--nav-indicator)' }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            />
          </>
        )}

        <Icon
          className={cn(
            'relative z-10 h-4 w-4 shrink-0 transition-all duration-200 group-hover:scale-105'
          )}
          style={{ color: isActive ? 'var(--nav-active-icon)' : 'var(--muted)' }}
        />
        <span className="relative z-10">{item.label}</span>
      </Link>
    );
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 backdrop-blur-md md:hidden transition-opacity"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-50 flex w-[260px] flex-col border-r px-4 py-5 transition-transform duration-300 ease-in-out md:static md:translate-x-0 backdrop-blur-2xl',
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
        style={{
          backgroundColor: 'var(--sidebar)',
          borderColor: 'var(--sidebar-border)',
        }}
      >
        {/* Header / Logo */}
        <div className="flex h-12 items-center justify-between px-2 mb-6">
          <Link to="/dashboard" className="flex items-center gap-3 font-bold group">
            <div
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border transition-transform duration-300 group-hover:scale-105"
              style={{
                backgroundColor: 'var(--primary-muted)',
                borderColor: 'var(--primary-border)',
                color: 'var(--primary)',
              }}
            >
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex flex-col leading-none">
              <span
                className="text-[16px] font-bold tracking-tight transition-colors"
                style={{ color: 'var(--text-primary)' }}
              >
                Synapse
              </span>
              <span
                className="text-[10px] font-medium tracking-wide mt-0.5"
                style={{ color: 'var(--primary)', opacity: 0.8 }}
              >
                AI Workspace
              </span>
            </div>
          </Link>

          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--muted)' }}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto pr-1">
          <div className="space-y-1">{primaryNavItems.map(renderNavLink)}</div>

          <div className="my-3.5 h-[1px]" style={{ backgroundColor: 'var(--border-subtle)' }} />

          <div className="space-y-1">{secondaryNavItems.map(renderNavLink)}</div>

          <div className="my-3.5 h-[1px]" style={{ backgroundColor: 'var(--border-subtle)' }} />

          <div className="space-y-1">{bottomNavItems.map(renderNavLink)}</div>
        </nav>

        {/* Version Card */}
        <div className="mt-auto pt-4">
          <div
            className="rounded-2xl border p-3.5 text-xs"
            style={{
              borderColor: 'var(--border)',
              backgroundColor: 'var(--surface-elevated)',
              color: 'var(--muted)',
            }}
          >
            <div className="font-semibold mb-1 flex items-center justify-between" style={{ color: 'var(--text-primary)' }}>
              <span>Synapse v1.0</span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: 'var(--primary)' }} />
                <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: 'var(--primary)' }} />
              </span>
            </div>
            <div className="text-[11px] font-normal" style={{ color: 'var(--muted)' }}>
              Sprint 3 · AI Workspace
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
