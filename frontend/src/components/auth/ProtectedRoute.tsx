import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { AuthModal } from './AuthModal';
import { GlassCard } from '../../design-system/components/GlassCard';
import { AdvancedButton } from '../../design-system/components/AdvancedButton';
import { GoogleSignInButton } from './GoogleSignInButton';
import { Sparkles, Lock, LogIn, UserPlus } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  fallback 
}) => {
  const { user, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  const handleShowAuth = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  // Show auth required screen if not authenticated
  if (!user) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <>
        <div className="min-h-screen flex items-center justify-center p-4">
          <GlassCard className="w-full max-w-md p-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Icon */}
              <motion.div
                className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl mb-6"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Lock className="h-10 w-10 text-white" />
              </motion.div>

              {/* Content */}
              <h1 className="text-2xl font-bold text-white mb-4">
                Authentication Required
              </h1>
              <p className="text-neutral-400 mb-8">
                Please sign in to access LexiGraph's advanced image generation features and save your creations.
              </p>

              {/* Action Buttons */}
              <div className="space-y-4">
                {/* Google Sign In */}
                <GoogleSignInButton />

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/20" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-neutral-900/50 text-neutral-400">Or</span>
                  </div>
                </div>

                <AdvancedButton
                  variant="primary"
                  size="lg"
                  className="w-full"
                  onClick={() => handleShowAuth('login')}
                  icon={<LogIn className="h-5 w-5" />}
                >
                  Sign In with Email
                </AdvancedButton>

                <AdvancedButton
                  variant="secondary"
                  size="lg"
                  className="w-full"
                  onClick={() => handleShowAuth('signup')}
                  icon={<UserPlus className="h-5 w-5" />}
                >
                  Create Account
                </AdvancedButton>
              </div>

              {/* Features List */}
              <div className="mt-8 text-left">
                <h3 className="text-lg font-semibold text-white mb-4">
                  What you'll get:
                </h3>
                <ul className="space-y-2 text-neutral-400">
                  <li className="flex items-center space-x-3">
                    <Sparkles className="h-4 w-4 text-primary-400 flex-shrink-0" />
                    <span>Advanced AI image generation</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Sparkles className="h-4 w-4 text-primary-400 flex-shrink-0" />
                    <span>Save and organize your creations</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Sparkles className="h-4 w-4 text-primary-400 flex-shrink-0" />
                    <span>Access to premium templates</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Sparkles className="h-4 w-4 text-primary-400 flex-shrink-0" />
                    <span>Batch processing capabilities</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Sparkles className="h-4 w-4 text-primary-400 flex-shrink-0" />
                    <span>Generation history and analytics</span>
                  </li>
                </ul>
              </div>
            </motion.div>
          </GlassCard>
        </div>

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          initialMode={authMode}
        />
      </>
    );
  }

  // User is authenticated, render children
  return <>{children}</>;
};

export default ProtectedRoute;
