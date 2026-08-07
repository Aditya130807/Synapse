import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '@/components/sidebar';
import { Navbar } from '@/components/navbar';

export default function DashboardLayout() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const location = useLocation();
  const isChatRoute = location.pathname === '/chat';

  // For /chat route, render full-bleed Desktop AI Workspace layout
  if (isChatRoute) {
    return (
      <div className="flex h-screen w-full overflow-hidden bg-[#030712] text-foreground antialiased selection:bg-blue-500/30 selection:text-blue-200">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#030712] text-foreground antialiased selection:bg-blue-500/30 selection:text-blue-200">
      {/* Sidebar (desktop fixed width / mobile drawer) */}
      <Sidebar
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden relative">
        {/* Subtle Ambient Background Radial Light Bleeds */}
        <div className="pointer-events-none absolute top-0 right-1/4 h-[400px] w-[500px] rounded-full bg-blue-600/10 blur-[150px]" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-[450px] w-[600px] rounded-full bg-indigo-600/10 blur-[160px]" />

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
