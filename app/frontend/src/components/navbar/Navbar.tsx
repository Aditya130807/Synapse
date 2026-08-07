import { useAuth } from '@/features/auth';
import { Menu, Command, Moon, LogOut, User as UserIcon, Sparkles } from 'lucide-react';
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

interface NavbarProps {
  onToggleMobileSidebar: () => void;
}

export default function Navbar({ onToggleMobileSidebar }: NavbarProps) {
  const { user, logout } = useAuth();

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
    <header className="sticky top-0 z-30 flex h-15 w-full items-center justify-between border-b border-white/[0.08] bg-[#060A14]/85 backdrop-blur-2xl px-4 md:px-6">
      {/* Left side: Mobile Toggle & Brand Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="md:hidden p-2 rounded-xl text-slate-400 hover:bg-white/[0.06] hover:text-white transition-colors"
          aria-label="Toggle sidebar menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-b from-blue-500/25 to-indigo-600/15 text-blue-400 border border-blue-500/35 shadow-[0_0_15px_rgba(59,130,246,0.2)] text-base">
            <Sparkles className="h-4.5 w-4.5" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[14px] font-bold tracking-tight text-white">Synapse</span>
            <span className="text-[10px] text-blue-400/80 hidden sm:inline-block font-medium mt-0.5">
              The AI Workspace
            </span>
          </div>
        </div>
      </div>

      {/* Center: Command Palette Trigger Placeholder (Cursor IDE & Linear Style) */}
      <div className="hidden sm:flex flex-1 max-w-md mx-6">
        <button
          type="button"
          className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-[rgba(15,23,42,0.65)] hover:bg-[#0A0F1D] border border-white/[0.08] hover:border-blue-500/40 text-slate-400 hover:text-slate-200 focus-within:border-blue-500/60 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:shadow-[0_0_16px_rgba(59,130,246,0.25)] transition-all duration-200 text-xs shadow-inner group cursor-pointer"
          onClick={() => {
            /* Placeholder for future Command Palette */
          }}
          aria-label="Search or command palette trigger placeholder"
        >
          <div className="flex items-center gap-2.5">
            <Command className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-400 transition-colors" />
            <span className="text-[12px] font-normal text-slate-400 group-hover:text-slate-200">
              Search or type a command...
            </span>
          </div>
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded-md border border-white/10 bg-white/[0.06] px-1.5 font-mono text-[10px] font-semibold text-slate-400 shadow-xs">
            <span className="text-[11px]">⌘</span>K
          </kbd>
        </button>
      </div>

      {/* Right side: Actions & User Avatar */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile Command Palette Icon */}
        <button
          type="button"
          className="sm:hidden p-2 rounded-xl text-slate-400 hover:bg-white/[0.06] hover:text-white transition-colors"
          aria-label="Search placeholder"
        >
          <Command className="h-4.5 w-4.5" />
        </button>

        {/* Theme Toggle Placeholder (UI only) */}
        <button
          type="button"
          className="p-2 rounded-xl text-slate-400 hover:text-blue-400 hover:bg-white/[0.06] border border-transparent hover:border-white/[0.08] transition-all duration-200 cursor-pointer"
          title="Theme switching placeholder (Dark mode only)"
          aria-label="Theme toggle placeholder"
        >
          <Moon className="h-4.5 w-4.5 text-slate-400 hover:text-blue-400 transition-colors" />
        </button>

        {/* User Profile Dropdown Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-9 px-2 rounded-xl flex items-center gap-2.5 hover:bg-white/[0.06] focus-visible:ring-0 cursor-pointer border border-transparent hover:border-white/[0.08] group transition-all duration-200"
            >
              <Avatar className="h-7 w-7 ring-2 ring-blue-500/30 shadow-[0_0_12px_rgba(59,130,246,0.25)] transition-transform duration-200 group-hover:scale-105">
                <AvatarFallback className="bg-gradient-to-tr from-blue-600 via-blue-500 to-indigo-600 text-white text-[11px] font-bold">
                  {getInitials(user?.name, user?.email)}
                </AvatarFallback>
              </Avatar>
              <span className="text-[12px] font-semibold text-slate-200 max-w-[120px] truncate hidden md:inline-block">
                {displayName}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-[#0F172A]/95 border-white/[0.08] text-white rounded-xl backdrop-blur-2xl shadow-2xl p-1.5" align="end">
            <DropdownMenuLabel className="font-normal p-2.5">
              <div className="flex flex-col space-y-1">
                <p className="text-xs font-semibold leading-none text-white">{displayName}</p>
                <p className="text-[11px] leading-none text-slate-400 truncate mt-0.5">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/[0.06] my-1" />
            <DropdownMenuItem className="cursor-pointer gap-2 text-xs text-slate-300 focus:bg-white/[0.08] focus:text-white rounded-lg">
              <UserIcon className="h-3.5 w-3.5 text-slate-400" />
              <span>Profile (UI Only)</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/[0.06] my-1" />
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
