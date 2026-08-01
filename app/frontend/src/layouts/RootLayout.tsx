import { Outlet } from 'react-router-dom';
import { AuthProvider } from '@/features/auth';

export default function RootLayout() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-background text-foreground">
        <main>
          <Outlet />
        </main>
      </div>
    </AuthProvider>
  );
}
