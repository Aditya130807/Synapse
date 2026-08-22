import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '@/components/sidebar';
import { Navbar } from '@/components/navbar';

export default function DashboardLayout() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const location = useLocation();
  const isChatRoute = location.pathname.startsWith('/chat');

  // For /chat routes, render full-bleed Desktop AI Workspace layout
  if (isChatRoute) {
    return (
      <div className="flex h-screen w-full overflow-hidden bg-background text-foreground antialiased">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground antialiased">
      {/* Sidebar (desktop fixed width / mobile drawer) */}
      <Sidebar
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden relative">
        {/* Ambient glow bleed */}
        <div className="ambient-glow pointer-events-none absolute top-0 right-1/4 h-[400px] w-[500px] rounded-full bg-[var(--primary)]/[0.04] blur-[150px]" />
        <div className="ambient-glow pointer-events-none absolute bottom-0 left-1/3 h-[450px] w-[600px] rounded-full bg-[var(--primary)]/[0.03] blur-[160px]" />

        <Navbar
          onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
        />

        <main className="flex-1 overflow-y-auto bg-transparent p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
