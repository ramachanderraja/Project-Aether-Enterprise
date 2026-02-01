import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-secondary-50 flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-primary-600">404</h1>
        <h2 className="text-2xl font-semibold text-secondary-900 mt-4">Page Not Found</h2>
        <p className="text-secondary-500 mt-2 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/dashboard"
          className="btn btn-primary mt-8 inline-flex items-center gap-2"
        >
          <Home size={18} />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
