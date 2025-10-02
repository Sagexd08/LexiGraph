import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, LogIn, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { GlassCard } from '../../design-system/components/GlassCard';
import { AdvancedButton } from '../../design-system/components/AdvancedButton';
import { FloatingInput } from '../../design-system/components/FloatingInput';
import { GoogleSignInButton } from './GoogleSignInButton';
import { cn } from '../../lib/utils';

interface LoginFormProps {
  onSwitchToSignUp: () => void;
  onClose?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToSignUp, onClose }) => {
  const { signIn, loading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const { error } = await signIn(formData.email, formData.password);
      
      if (error) {
        setError(error.message);
      } else {
        onClose?.();
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  return (
    <GlassCard className="w-full max-w-md mx-auto p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl mb-4"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Sparkles className="h-8 w-8 text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-neutral-400">Sign in to continue creating amazing images</p>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl"
          >
            <p className="text-red-400 text-sm text-center">{error}</p>
          </motion.div>
        )}

        {/* Google Sign In */}
        <div className="mb-6">
          <GoogleSignInButton
            onSuccess={onClose}
            onError={setError}
            disabled={isSubmitting}
          />
        </div>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/20" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-neutral-900/50 text-neutral-400">Or continue with email</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <FloatingInput
            type="email"
            label="Email Address"
            value={formData.email}
            onChange={(value) => handleInputChange('email', value)}
            icon={<Mail className="h-5 w-5" />}
            required
            disabled={isSubmitting}
          />

          <div className="relative">
            <FloatingInput
              type={showPassword ? 'text' : 'password'}
              label="Password"
              value={formData.password}
              onChange={(value) => handleInputChange('password', value)}
              icon={<Lock className="h-5 w-5" />}
              required
              disabled={isSubmitting}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors"
              disabled={isSubmitting}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>

          <AdvancedButton
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            loading={isSubmitting}
            disabled={!formData.email || !formData.password || isSubmitting}
            icon={<LogIn className="h-5 w-5" />}
          >
            {isSubmitting ? 'Signing In...' : 'Sign In'}
          </AdvancedButton>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-neutral-400 text-sm">
            Don't have an account?{' '}
            <button
              onClick={onSwitchToSignUp}
              className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
              disabled={isSubmitting}
            >
              Sign up
            </button>
          </p>
        </div>

        {/* Forgot Password */}
        <div className="mt-4 text-center">
          <button
            className="text-neutral-500 hover:text-neutral-400 text-sm transition-colors"
            disabled={isSubmitting}
          >
            Forgot your password?
          </button>
        </div>
      </motion.div>
    </GlassCard>
  );
};

export default LoginForm;
