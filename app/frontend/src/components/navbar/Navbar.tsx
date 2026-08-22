import { useAuth } from '@/features/auth';
import { Menu, Command, Moon, Sun, LogOut, User as UserIcon, Sparkles } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';

interface NavbarProps {
  onToggleMobileSidebar: () => void;
}

export default function Navbar({ onToggleMobileSidebar }: NavbarProps) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const getInitials = (name?: string, email?: string) => {
    if (name && name.trim()) {
      const parts = name.trim().split(' ').filter(Boolean);
      if (parts.length >= 2 && parts[0] && parts[1]) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return 'US';
  };

  const displayName = user?.name || user?.email || 'User';

  return (
    <header
      className="sticky top-0 z-30 flex h-15 w-full items-center justify-between border-b px-4 md:px-6 backdrop-blur-2xl transition-colors duration-200"
      style={{ backgroundColor: 'var(--navbar)', borderColor: 'var(--navbar-border)' }}
    >
      {/* Left side: Mobile Toggle & Brand Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="md:hidden p-2 rounded-xl transition-colors"
          style={{ color: 'var(--muted)' }}
          aria-label="Toggle sidebar menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl border text-base"
            style={{
              backgroundColor: 'var(--primary-muted)',
              borderColor: 'var(--primary-border)',
              color: 'var(--primary)',
            }}
          >
            <Sparkles className="h-[18px] w-[18px]" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[14px] font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Synapse
            </span>
            <span
              className="text-[10px] hidden sm:inline-block font-medium mt-0.5"
              style={{ color: 'var(--primary)', opacity: 0.8 }}
            >
              The AI Workspace
            </span>
          </div>
        </div>
      </div>

      {/* Center: Command Palette Trigger */}
      <div className="hidden sm:flex flex-1 max-w-md mx-6">
        <button
          type="button"
          className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl border text-xs transition-all duration-200 group cursor-pointer"
          style={{
            backgroundColor: 'var(--input)',
            borderColor: 'var(--border)',
            color: 'var(--muted)',
          }}
          onClick={() => { /* Future command palette */ }}
          aria-label="Search or command palette"
        >
          <div className="flex items-center gap-2.5">
            <Command className="h-3.5 w-3.5" style={{ color: 'var(--muted)' }} />
            <span className="text-[12px] font-normal" style={{ color: 'var(--muted)' }}>
              Search or type a command...
            </span>
          </div>
          <kbd
            className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded-md border px-1.5 font-mono text-[10px] font-semibold"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)', color: 'var(--muted)' }}
          >
            <span className="text-[11px]">⌘</span>K
          </kbd>
        </button>
      </div>

      {/* Right side: Actions & User Avatar */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile Command icon */}
        <button
          type="button"
          className="sm:hidden p-2 rounded-xl transition-colors"
          style={{ color: 'var(--muted)' }}
          aria-label="Search"
        >
          <Command className="h-[18px] w-[18px]" />
        </button>

        {/* Theme Toggle — FUNCTIONAL */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-xl border border-transparent transition-all duration-200 cursor-pointer"
          style={{ color: 'var(--muted)' }}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="h-[18px] w-[18px]" />
          ) : (
            <Moon className="h-[18px] w-[18px]" />
          )}
        </button>

        {/* User Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-9 px-2 rounded-xl flex items-center gap-2.5 focus-visible:ring-0 cursor-pointer border border-transparent transition-all duration-200"
              style={{ color: 'var(--text-secondary)' }}
            >
              <Avatar className="h-7 w-7 transition-transform duration-200 hover:scale-105"
                style={{ boxShadow: '0 0 12px var(--primary-glow)', outline: '2px solid var(--primary-border)' }}
              >
                <AvatarFallback
                  className="text-xs font-bold"
                  style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
                >
                  {getInitials(user?.name, user?.email)}
                </AvatarFallback>
              </Avatar>
              <span
                className="text-[12px] font-semibold max-w-[120px] truncate hidden md:inline-block"
                style={{ color: 'var(--text-secondary)' }}
              >
                {displayName}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-56 rounded-xl backdrop-blur-2xl shadow-2xl p-1.5 border"
            style={{
              backgroundColor: 'var(--dropdown)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)',
            }}
            align="end"
          >
            <DropdownMenuLabel className="font-normal p-2.5">
              <div className="flex flex-col space-y-1">
                <p className="text-xs font-semibold leading-none" style={{ color: 'var(--text-primary)' }}>
                  {displayName}
                </p>
                <p className="text-[11px] leading-none truncate mt-0.5" style={{ color: 'var(--muted)' }}>
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator style={{ backgroundColor: 'var(--border-subtle)' }} className="my-1" />
            <DropdownMenuItem
              className="cursor-pointer gap-2 text-xs rounded-lg"
              style={{ color: 'var(--text-secondary)' }}
            >
              <UserIcon className="h-3.5 w-3.5" style={{ color: 'var(--muted)' }} />
              <span>Profile (UI Only)</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator style={{ backgroundColor: 'var(--border-subtle)' }} className="my-1" />
            <DropdownMenuItem
              onClick={logout}
              className="cursor-pointer gap-2 text-xs text-rose-400 focus:bg-rose-500/10 focus:text-rose-300 rounded-lg"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
