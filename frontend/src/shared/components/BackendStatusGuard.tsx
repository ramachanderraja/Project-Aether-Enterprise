import { ReactNode, useEffect, useState, useCallback } from 'react';
import { AlertTriangle, RefreshCw, ServerOff } from 'lucide-react';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { apiClient } from '@shared/services/api/apiClient';

interface BackendStatusGuardProps {
  children: ReactNode;
}

type Status = 'checking' | 'connected' | 'error';

export function BackendStatusGuard({ children }: BackendStatusGuardProps) {
  const [status, setStatus] = useState<Status>('checking');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const checkBackend = useCallback(async () => {
    setStatus('checking');
    setErrorMsg(null);
    try {
      await apiClient.get('/data/closed-acv');
      setStatus('connected');
    } catch (err) {
      setErrorMsg(String(err));
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    checkBackend();
  }, [checkBackend]);

  if (status === 'checking') {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-secondary-500 text-sm">Connecting to server...</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="max-w-md w-full mx-auto text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50">
            <ServerOff className="w-8 h-8 text-red-500" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-secondary-900">
              Unable to Connect to Server
            </h2>
            <p className="text-secondary-500 text-sm leading-relaxed">
              The backend server is not responding. Please make sure the API server
              is running and try again.
            </p>
          </div>

          {errorMsg && (
            <div className="bg-red-50 border border-red-100 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700 text-left break-all">
                  {errorMsg}
                </p>
              </div>
            </div>
          )}

          <button
            onClick={checkBackend}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
