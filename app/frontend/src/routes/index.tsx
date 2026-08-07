import { createBrowserRouter, Navigate } from 'react-router-dom';
import RootLayout from '@/layouts/RootLayout';
import DashboardLayout from '@/layouts/DashboardLayout';
import NotFoundPage from '@/pages/NotFoundPage';
import LoginPage from '@/features/auth/components/LoginPage';
import SignupPage from '@/features/auth/components/SignupPage';
import ProtectedRoute from '@/features/auth/components/ProtectedRoute';
import { DashboardPage } from '@/features/dashboard';
import { ChatPage } from '@/features/chat';
import { HistoryPage } from '@/features/history';
import { FilesPage } from '@/features/files';
import { SettingsPage } from '@/features/settings';

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      // Public routes
      {
        path: '/login',
        element: <LoginPage />,
      },
      {
        path: '/signup',
        element: <SignupPage />,
      },
      // Protected workspace routes wrapped in DashboardLayout
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <DashboardLayout />,
            children: [
              {
                path: '/',
                element: <Navigate to="/dashboard" replace />,
              },
              {
                path: '/dashboard',
                element: <DashboardPage />,
              },
              {
                path: '/chat',
                element: <ChatPage />,
              },
              {
                path: '/history',
                element: <HistoryPage />,
              },
              {
                path: '/files',
                element: <FilesPage />,
              },
              {
                path: '/settings',
                element: <SettingsPage />,
              },
            ],
          },
        ],
      },
      // 404
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);

