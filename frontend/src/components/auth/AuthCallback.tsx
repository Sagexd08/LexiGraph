import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { GlassCard } from '../../design-system/components/GlassCard';

interface AuthCallbackProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export const AuthCallback: React.FC<AuthCallbackProps> = ({
  onSuccess,
  onError,
}) => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing authentication...');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the URL hash parameters
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const error = hashParams.get('error');
        const errorDescription = hashParams.get('error_description');

        if (error) {
          setStatus('error');
          setMessage(errorDescription || 'Authentication failed');
          onError?.(errorDescription || 'Authentication failed');
          return;
        }

        if (accessToken) {
          // Set the session with the tokens
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });

          if (sessionError) {
            setStatus('error');
            setMessage('Failed to establish session');
            onError?.('Failed to establish session');
            return;
          }

          setStatus('success');
          setMessage('Authentication successful! Redirecting...');
          
          // Redirect to main app after a short delay
          setTimeout(() => {
            onSuccess?.();
            // Clear the hash from URL
            window.history.replaceState(null, '', window.location.pathname);
          }, 2000);
        } else {
          setStatus('error');
          setMessage('No authentication token received');
          onError?.('No authentication token received');
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        setStatus('error');
        setMessage('An unexpected error occurred');
        onError?.('An unexpected error occurred');
      }
    };

    handleAuthCallback();
  }, [onSuccess, onError]);

  const getIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-8 w-8 text-primary-400 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-8 w-8 text-green-400" />;
      case 'error':
        return <XCircle className="h-8 w-8 text-red-400" />;
      default:
        return <Loader2 className="h-8 w-8 text-primary-400 animate-spin" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'loading':
        return 'text-primary-400';
      case 'success':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-primary-400';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950" />
      <div className="fixed inset-0 bg-gradient-to-tr from-primary-950/20 via-transparent to-secondary-950/20" />
      
      <GlassCard className="w-full max-w-md p-8 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="mb-8">
            <motion.div
              className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl mb-4"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Sparkles className="h-8 w-8 text-white" />
            </motion.div>
            <h1 className="text-2xl font-bold text-white mb-2">LexiGraph</h1>
          </div>

          {/* Status Icon */}
          <motion.div
            key={status}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="mb-6"
          >
            {getIcon()}
          </motion.div>

          {/* Status Message */}
          <motion.div
            key={message}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className={`text-lg font-semibold mb-2 ${getStatusColor()}`}>
              {status === 'loading' && 'Authenticating...'}
              {status === 'success' && 'Welcome to LexiGraph!'}
              {status === 'error' && 'Authentication Failed'}
            </h2>
            <p className="text-neutral-400 text-sm">{message}</p>
          </motion.div>

          {/* Loading Animation */}
          {status === 'loading' && (
            <motion.div
              className="mt-6 flex justify-center space-x-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 bg-primary-400 rounded-full"
                  animate={{
                    y: [-4, 4, -4],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </motion.div>
          )}

          {/* Error Actions */}
          {status === 'error' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-6"
            >
              <button
                onClick={() => window.location.href = '/'}
                className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
              >
                Return to Home
              </button>
            </motion.div>
          )}
        </motion.div>
      </GlassCard>
    </div>
  );
};

export default AuthCallback;
