import { createBrowserRouter } from 'react-router-dom';
import RootLayout from '@/layouts/RootLayout';
import HomePage from '@/pages/HomePage';
import NotFoundPage from '@/pages/NotFoundPage';
import LoginPage from '@/features/auth/components/LoginPage';
import SignupPage from '@/features/auth/components/SignupPage';
import ProtectedRoute from '@/features/auth/components/ProtectedRoute';

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
      // Protected routes
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: '/',
            element: <HomePage />,
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
