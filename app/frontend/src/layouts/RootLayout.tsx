import { Outlet } from 'react-router-dom';
import { AuthProvider } from '@/features/auth';
import { TooltipProvider } from '@/components/ui/tooltip';

export default function RootLayout() {
  return (
    <AuthProvider>
      <TooltipProvider>
        <div className="min-h-screen bg-background text-foreground">
          <main>
            <Outlet />
          </main>
        </div>
      </TooltipProvider>
    </AuthProvider>
  );
}

