'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Lock, CheckCircle } from 'lucide-react';
import { Input, Button } from '@/components/ui';
import { PasswordStrength } from '@/components/ui/PasswordStrength';
import { fadeInUp, staggerContainer, staggerItem, transitions } from '@/lib/animations';
import { authAPI } from '@/handlers/auth';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [touched, setTouched] = useState({ password: false, confirmPassword: false });

  const validatePassword = (value: string, showError: boolean = true) => {
    if (!value) {
      if (showError) setPasswordError('Password is required');
      return false;
    }
    if (value.length < 6) {
      if (showError) setPasswordError('Password must be at least 6 characters');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const validateConfirmPassword = (value: string, showError: boolean = true) => {
    if (!value) {
      if (showError) setConfirmPasswordError('Please confirm your password');
      return false;
    }
    if (value !== password) {
      if (showError) setConfirmPasswordError('Passwords do not match');
      return false;
    }
    setConfirmPasswordError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const isPasswordValid = validatePassword(password, true);
    const isConfirmPasswordValid = validateConfirmPassword(confirmPassword, true);

    if (!isPasswordValid || !isConfirmPasswordValid) {
      return;
    }

    setLoading(true);

    try {
      await authAPI.updatePassword(password);
      setSuccess(true);
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 bg-background">
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={transitions.spring}
          className="w-full max-w-md text-center"
        >
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-serif mb-4">Password Reset Successfully</h1>
          <p className="text-sm text-secondary/70 mb-8">
            Your password has been updated. Redirecting you to login...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 bg-background">
      <motion.div
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        transition={transitions.spring}
        className="w-full max-w-md"
      >
        {/* Header */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="text-center mb-12"
        >
          <motion.h1
            variants={staggerItem}
            className="text-3xl font-serif"
          >
            Set New Password
          </motion.h1>

          <motion.p variants={staggerItem} className="mt-4 text-sm text-secondary/70">
            Please enter your new password below.
          </motion.p>
        </motion.div>

        {/* Form */}
        <motion.form
          onSubmit={handleSubmit}
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg bg-error/10 border border-error/20 p-4 text-sm text-error mb-6"
            >
              {error}
            </motion.div>
          )}

          {/* Password Input */}
          <div className="mb-6">
            <Input
              id="password"
              type="password"
              label="New Password"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (touched.password) validatePassword(e.target.value, true);
                // Clear confirm password error if passwords now match
                if (confirmPassword && e.target.value === confirmPassword) {
                  setConfirmPasswordError('');
                }
              }}
              onBlur={() => {
                setTouched(prev => ({ ...prev, password: true }));
                validatePassword(password, true);
              }}
              error={touched.password ? passwordError : ''}
              placeholder="••••••••"
              leftIcon={<Lock className="w-5 h-5" />}
              autoComplete="new-password"
            />
            {/* Password Strength Indicator */}
            {password && !passwordError && (
              <div className="mt-3">
                <PasswordStrength password={password} />
              </div>
            )}
          </div>

          {/* Confirm Password Input */}
          <div className="mb-8">
            <Input
              id="confirmPassword"
              type="password"
              label="Confirm New Password"
              required
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (touched.confirmPassword) validateConfirmPassword(e.target.value, true);
              }}
              onBlur={() => {
                setTouched(prev => ({ ...prev, confirmPassword: true }));
                validateConfirmPassword(confirmPassword, true);
              }}
              error={touched.confirmPassword ? confirmPasswordError : ''}
              placeholder="••••••••"
              leftIcon={<Lock className="w-5 h-5" />}
              autoComplete="new-password"
            />
          </div>

          {/* Submit Button */}
          <div className="mb-6">
            <Button
              type="submit"
              variant="primary"
              size="large"
              loading={loading}
              className="w-full uppercase tracking-wide text-sm"
            >
              {loading ? 'RESETTING...' : 'RESET PASSWORD'}
            </Button>
          </div>

          {/* Back to Login Link */}
          <div className="text-center">
            <p className="text-xs text-secondary/50">
              Remember your password?{' '}
              <Link href="/login" className="text-primary hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </motion.form>
      </motion.div>
    </div>
  );
}
