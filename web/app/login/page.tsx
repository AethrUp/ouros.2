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
  const [touched, setTouched] = useState({ email: false, password: false });

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const isEmailValid = validateEmail(email, true);
    const isPasswordValid = validatePassword(password, true);

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
    setLoading(true);
    setError(null);

    try {
      const { signInWithProvider } = useAppStore.getState();
      await signInWithProvider(provider);
      // OAuth will redirect to callback URL, no need to manually navigate
    } catch (err: any) {
      setError(err.message || `Failed to sign in with ${provider}`);
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
        className="w-full max-w-md lg:max-w-xl xl:max-w-2xl"
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
            Welcome to Ouros
          </motion.h1>

          <motion.p variants={staggerItem} className="mt-4 text-sm text-secondary/70">
            Don't have an account yet?{' '}
            <Link href="/register" className="text-white hover:text-primary transition-colors">
              Sign Up
            </Link>
          </motion.p>
        </motion.div>

        {/* Form */}
        <motion.form
          onSubmit={handleLogin}
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
                if (touched.email) validateEmail(e.target.value, true);
              }}
              onBlur={() => {
                setTouched(prev => ({ ...prev, email: true }));
                validateEmail(email, true);
              }}
              error={touched.email ? emailError : ''}
              placeholder="your email"
              autoComplete="email"
            />
          </div>

          {/* Password Input */}
          <div className="mb-4">
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (touched.password) validatePassword(e.target.value, true);
              }}
              onBlur={() => {
                setTouched(prev => ({ ...prev, password: true }));
                validatePassword(password, true);
              }}
              error={touched.password ? passwordError : ''}
              placeholder="your password"
              autoComplete="current-password"
            />
          </div>

          {/* Forgot Password Link */}
          <div className="mb-12 text-right">
            <Link
              href="/forgot-password"
              className="text-sm text-secondary/70 hover:text-primary transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          {/* Submit Button */}
          <div className="mb-10">
            <Button
              type="submit"
              variant="primary"
              size="large"
              loading={loading}
              className="w-full uppercase tracking-wide text-sm"
            >
              {loading ? 'LOGGING IN...' : 'LOGIN'}
            </Button>
          </div>

          {/* Divider */}
          {/* Temporarily hidden - social login not yet configured
          <div className="relative mb-10">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-4 bg-background text-secondary/50">or</span>
            </div>
          </div>

          Social Login Buttons
          <div className="grid grid-cols-2 gap-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => handleSocialLogin('apple')}
              disabled={loading}
              className="w-full h-12 flex items-center justify-center bg-[#565656] border-0 hover:bg-[#656565] text-white"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={() => handleSocialLogin('google')}
              disabled={loading}
              className="w-full h-12 flex items-center justify-center bg-[#565656] border-0 hover:bg-[#656565] text-white"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
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
            </Button>
          </div>
          */}
        </motion.form>
      </motion.div>
    </div>
  );
}
