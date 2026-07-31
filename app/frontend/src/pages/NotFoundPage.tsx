import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold">404</h1>
        <p className="mt-2 text-lg text-gray-500">Page not found</p>
        <Link
          to="/"
          className="mt-4 inline-block text-blue-500 hover:underline"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
