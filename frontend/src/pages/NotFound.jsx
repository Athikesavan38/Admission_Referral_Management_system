import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-[#0f1117] dark:via-[#1a1d2e] dark:to-[#0f1117] text-center px-4">
      <div className="animate-slide-up">
        <div className="text-8xl mb-4">🔍</div>
        <h1 className="text-7xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">404</h1>
        <p className="mt-3 text-lg font-semibold text-gray-700 dark:text-gray-200">Page not found</p>
        <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">The page you're looking for doesn't exist.</p>
        <Link to="/"
          className="mt-8 inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-glow transition-all">
          ← Back to home
        </Link>
      </div>
    </div>
  );
}
