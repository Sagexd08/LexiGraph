import React, { Component, ErrorInfo, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { GlassCard, AdvancedButton } from '../../design-system';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          {/* Background Effects */}
          <div className="fixed inset-0 bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950" />
          <div className="fixed inset-0 bg-gradient-to-tr from-red-950/20 via-transparent to-orange-950/20" />
          
          <GlassCard className="w-full max-w-2xl p-8 text-center relative z-10" variant="elevated">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Error Icon */}
              <motion.div
                className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl mb-6"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <AlertTriangle className="h-8 w-8 text-white" />
              </motion.div>

              {/* Error Message */}
              <h1 className="text-2xl font-bold text-white mb-4">
                Oops! Something went wrong
              </h1>
              
              <p className="text-neutral-300 mb-6">
                We encountered an unexpected error. Don't worry, this has been logged and our team will look into it.
              </p>

              {/* Error Details (Development Mode) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <GlassCard className="mb-6 p-4 text-left" variant="default">
                  <h3 className="text-sm font-semibold text-red-400 mb-2 flex items-center">
                    <Bug className="h-4 w-4 mr-2" />
                    Error Details (Development)
                  </h3>
                  <pre className="text-xs text-neutral-400 overflow-auto max-h-32">
                    {this.state.error.message}
                    {this.state.errorInfo?.componentStack && (
                      <>
                        {'\n\nComponent Stack:'}
                        {this.state.errorInfo.componentStack}
                      </>
                    )}
                  </pre>
                </GlassCard>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <AdvancedButton
                  onClick={this.handleReset}
                  variant="primary"
                  icon={<RefreshCw className="h-4 w-4" />}
                >
                  Try Again
                </AdvancedButton>
                
                <AdvancedButton
                  onClick={this.handleReload}
                  variant="secondary"
                  icon={<RefreshCw className="h-4 w-4" />}
                >
                  Reload Page
                </AdvancedButton>
                
                <AdvancedButton
                  onClick={this.handleGoHome}
                  variant="ghost"
                  icon={<Home className="h-4 w-4" />}
                >
                  Go Home
                </AdvancedButton>
              </div>

              {/* Additional Help */}
              <div className="mt-8 pt-6 border-t border-white/10">
                <p className="text-sm text-neutral-400">
                  If this problem persists, please{' '}
                  <a 
                    href="mailto:support@lexigraph.com" 
                    className="text-primary-400 hover:text-primary-300 underline"
                  >
                    contact support
                  </a>
                  {' '}or{' '}
                  <a 
                    href="https://github.com/lexigraph/issues" 
                    className="text-primary-400 hover:text-primary-300 underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    report an issue
                  </a>
                  .
                </p>
              </div>
            </motion.div>
          </GlassCard>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
