'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft } from 'lucide-react';
import { Input, Button } from '@/components/ui';
import { fadeInUp, staggerContainer, staggerItem, transitions } from '@/lib/animations';
import { authAPI } from '@/handlers/auth';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState('');
  const [touched, setTouched] = useState(false);

  const validateEmail = (value: string, showError: boolean = true) => {
    if (!value) {
      if (showError) setEmailError('Email is required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      if (showError) setEmailError('Invalid email format');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const isEmailValid = validateEmail(email, true);

    if (!isEmailValid) {
      return;
    }

    setLoading(true);

    try {
      await authAPI.resetPassword(email);
      // Navigate to confirmation page
      router.push('/forgot-password/confirmation');
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 bg-background">
      <motion.div
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        transition={transitions.spring}
        className="w-full max-w-md"
      >
        {/* Back to Login Link */}
        <motion.div
          variants={staggerItem}
          className="mb-8"
        >
          <Link
            href="/login"
            className="inline-flex items-center text-sm text-secondary hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </Link>
        </motion.div>

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
            Reset Password
          </motion.h1>

          <motion.p variants={staggerItem} className="mt-4 text-sm text-secondary/70">
            Enter your email address and we'll send you a link to reset your password.
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

          {/* Email Input */}
          <div className="mb-8">
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (touched) validateEmail(e.target.value, true);
              }}
              onBlur={() => {
                setTouched(true);
                validateEmail(email, true);
              }}
              error={touched ? emailError : ''}
              placeholder="your email"
              leftIcon={<Mail className="w-5 h-5" />}
              autoComplete="email"
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
              {loading ? 'SENDING...' : 'SEND RESET LINK'}
            </Button>
          </div>

          {/* Additional Help Text */}
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
