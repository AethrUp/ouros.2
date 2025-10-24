'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Lock, Apple } from 'lucide-react';
import { useAppStore } from '@/store';
import { Input, Button } from '@/components/ui';
import { fadeInUp, staggerContainer, staggerItem, transitions } from '@/lib/animations';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAppStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validateEmail = (value: string) => {
    if (!value) {
      setEmailError('Email is required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      setEmailError('Invalid email format');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePassword = (value: string) => {
    if (!value) {
      setPasswordError('Password is required');
      return false;
    }
    if (value.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    setLoading(true);

    try {
      await login({ email, password });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'apple' | 'google') => {
    console.log(`Social login with ${provider} (not yet implemented)`);
    // TODO: Implement social login with Supabase
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
        {/* Header */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="text-center mb-8"
        >
          <motion.div variants={staggerItem}>
            <Link href="/">
              <h1 className="text-4xl font-bold font-serif cursor-pointer hover:text-primary transition-colors">
                Ouros
              </h1>
            </Link>
          </motion.div>

          <motion.h2 variants={staggerItem} className="text-2xl font-semibold mt-6">
            Welcome Back
          </motion.h2>

          <motion.p variants={staggerItem} className="mt-2 text-secondary">
            Sign in to explore your cosmic path
          </motion.p>

          <motion.div variants={staggerItem} className="mt-4">
            <p className="text-sm text-secondary">
              Don't have an account?{' '}
              <Link href="/register" className="text-primary hover:underline font-medium">
                Sign Up
              </Link>
            </p>
          </motion.div>
        </motion.div>

        {/* Form */}
        <motion.form
          onSubmit={handleLogin}
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-6"
        >
          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg bg-error/10 border border-error/20 p-4 text-sm text-error"
            >
              {error}
            </motion.div>
          )}

          {/* Email Input */}
          <motion.div variants={staggerItem}>
            <Input
              id="email"
              type="email"
              label="Email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) validateEmail(e.target.value);
              }}
              onBlur={() => validateEmail(email)}
              error={emailError}
              placeholder="you@example.com"
              leftIcon={<Mail className="w-5 h-5" />}
              autoComplete="email"
            />
          </motion.div>

          {/* Password Input */}
          <motion.div variants={staggerItem}>
            <Input
              id="password"
              type="password"
              label="Password"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) validatePassword(e.target.value);
              }}
              onBlur={() => validatePassword(password)}
              error={passwordError}
              placeholder="••••••••"
              leftIcon={<Lock className="w-5 h-5" />}
              autoComplete="current-password"
            />
          </motion.div>

          {/* Forgot Password */}
          <motion.div variants={staggerItem} className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-sm text-secondary hover:text-primary transition-colors"
            >
              Forgot password?
            </Link>
          </motion.div>

          {/* Submit Button */}
          <motion.div variants={staggerItem}>
            <Button
              type="submit"
              variant="primary"
              size="large"
              loading={loading}
              className="w-full"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </motion.div>

          {/* Divider */}
          <motion.div variants={staggerItem} className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-background text-secondary">Or continue with</span>
            </div>
          </motion.div>

          {/* Social Login Buttons */}
          <motion.div variants={staggerItem} className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => handleSocialLogin('google')}
              disabled={loading}
              className="w-full"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={() => handleSocialLogin('apple')}
              disabled={loading}
              className="w-full"
            >
              <Apple className="w-5 h-5 mr-2" />
              Apple
            </Button>
          </motion.div>
        </motion.form>
      </motion.div>
    </div>
  );
}
