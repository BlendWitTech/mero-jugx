// @ts-nocheck
import * as React from 'react';
import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

declare global {
  interface Window {
    Sentry?: any;
  }
}

class ErrorBoundaryClass extends Component<any, any> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });

    // Log to error tracking service (e.g., Sentry) if available
    if (window.Sentry) {
      window.Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
      });
    }
  }

  render() {
    const { hasError, error, errorInfo } = this.state;
    if (hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <ErrorFallback error={error} errorInfo={errorInfo} />;
    }

    return this.props.children;
  }
}

function ErrorFallback({ error, errorInfo }: { error: Error | null; errorInfo: ErrorInfo | null }) {
  const navigate = useNavigate();
  const { organization } = useAuthStore();

  const handleReload = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    if (organization?.slug) {
      navigate(`/org/${organization.slug}`);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#36393f] p-4">
      <div className="max-w-2xl w-full bg-[#2f3136] rounded-lg border border-[#202225] p-8">
        <div className="flex items-center justify-center mb-6">
          <div className="p-4 bg-red-500/20 rounded-full">
            <AlertCircle className="h-12 w-12 text-red-400" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-white text-center mb-4">Something went wrong</h1>
        <p className="text-[#b9bbbe] text-center mb-6">
          We're sorry, but something unexpected happened. Please try refreshing the page or going back to the dashboard.
        </p>

        {import.meta.env.MODE === 'development' && error && (
          <div className="mb-6 p-4 bg-[#202225] rounded-lg border border-[#36393f]">
            <p className="text-sm font-semibold text-red-400 mb-2">Error Details (Development Only):</p>
            <p className="text-xs text-[#b9bbbe] font-mono mb-2">{error.message}</p>
            {errorInfo && errorInfo.componentStack && (
              <details className="mt-2">
                <summary className="text-xs text-[#8e9297] cursor-pointer hover:text-[#b9bbbe]">
                  Component Stack
                </summary>
                <pre className="text-xs text-[#8e9297] mt-2 overflow-auto max-h-40">
                  {errorInfo.componentStack}
                </pre>
              </details>
            )}
            {error.stack && (
              <details className="mt-2">
                <summary className="text-xs text-[#8e9297] cursor-pointer hover:text-[#b9bbbe]">
                  Stack Trace
                </summary>
                <pre className="text-xs text-[#8e9297] mt-2 overflow-auto max-h-40">
                  {error.stack}
                </pre>
              </details>
            )}
          </div>
        )}

        <div className="flex gap-4 justify-center">
          <button
            onClick={handleReload}
            className="px-6 py-3 bg-[#5865f2] text-white rounded-lg font-medium hover:bg-[#4752c4] transition-colors flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Reload Page
          </button>
          <button
            onClick={handleGoHome}
            className="px-6 py-3 bg-[#36393f] text-white rounded-lg font-medium hover:bg-[#2d2f33] transition-colors flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

// Export as a functional component wrapper for easier use
export default function ErrorBoundary({ children, fallback }: Props) {
  const Component = ErrorBoundaryClass as any;
  return <Component fallback={fallback}>{children}</Component>;
}

