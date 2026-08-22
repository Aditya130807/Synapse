import { Outlet } from 'react-router-dom';
import { AuthProvider } from '@/features/auth';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeProvider } from '@/contexts/ThemeContext';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <div className="min-h-screen bg-background text-foreground">
            <main>
              <Outlet />
            </main>
          </div>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
