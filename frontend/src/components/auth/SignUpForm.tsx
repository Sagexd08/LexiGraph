import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, UserPlus, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { GlassCard } from '../../design-system/components/GlassCard';
import { AdvancedButton } from '../../design-system/components/AdvancedButton';
import { FloatingInput } from '../../design-system/components/FloatingInput';
import { GoogleSignInButton } from './GoogleSignInButton';
import { cn } from '../../lib/utils';

interface SignUpFormProps {
  onSwitchToLogin: () => void;
  onClose?: () => void;
}

export const SignUpForm: React.FC<SignUpFormProps> = ({ onSwitchToLogin, onClose }) => {
  const { signUp, loading } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      return 'Full name is required';
    }
    if (!formData.email.trim()) {
      return 'Email is required';
    }
    if (formData.password.length < 6) {
      return 'Password must be at least 6 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      return 'Passwords do not match';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await signUp(formData.email, formData.password, {
        full_name: formData.fullName,
      });
      
      if (error) {
        setError(error.message);
      } else {
        setSuccess('Account created successfully! Please check your email to verify your account.');
        // Don't close immediately, let user see the success message
        setTimeout(() => {
          onClose?.();
        }, 3000);
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
    if (success) setSuccess(null);
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
          <h1 className="text-2xl font-bold text-white mb-2">Create Account</h1>
          <p className="text-neutral-400">Join LexiGraph and start creating amazing images</p>
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

        {/* Success Message */}
        {success && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl"
          >
            <p className="text-green-400 text-sm text-center">{success}</p>
          </motion.div>
        )}

        {/* Google Sign In */}
        <div className="mb-6">
          <GoogleSignInButton
            onSuccess={() => {
              // Don't close immediately for sign up, let user see success message
              setTimeout(() => onClose?.(), 2000);
            }}
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
            <span className="px-4 bg-neutral-900/50 text-neutral-400">Or create account with email</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <FloatingInput
            type="text"
            label="Full Name"
            value={formData.fullName}
            onChange={(value) => handleInputChange('fullName', value)}
            icon={<User className="h-5 w-5" />}
            required
            disabled={isSubmitting}
          />

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

          <div className="relative">
            <FloatingInput
              type={showConfirmPassword ? 'text' : 'password'}
              label="Confirm Password"
              value={formData.confirmPassword}
              onChange={(value) => handleInputChange('confirmPassword', value)}
              icon={<Lock className="h-5 w-5" />}
              required
              disabled={isSubmitting}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors"
              disabled={isSubmitting}
            >
              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>

          <AdvancedButton
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            loading={isSubmitting}
            disabled={isSubmitting}
            icon={<UserPlus className="h-5 w-5" />}
          >
            {isSubmitting ? 'Creating Account...' : 'Create Account'}
          </AdvancedButton>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-neutral-400 text-sm">
            Already have an account?{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
              disabled={isSubmitting}
            >
              Sign in
            </button>
          </p>
        </div>

        {/* Terms */}
        <div className="mt-4 text-center">
          <p className="text-neutral-500 text-xs">
            By creating an account, you agree to our{' '}
            <a href="#" className="text-primary-400 hover:text-primary-300 transition-colors">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="text-primary-400 hover:text-primary-300 transition-colors">
              Privacy Policy
            </a>
          </p>
        </div>
      </motion.div>
    </GlassCard>
  );
};

export default SignUpForm;
