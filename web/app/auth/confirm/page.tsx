'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import { Button } from '@/components/ui';
import { supabase } from '@/utils/supabase';
import { fadeInUp, transitions } from '@/lib/animations';

export default function ConfirmEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        // Supabase automatically handles the token from the URL
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Confirmation error:', error);
          setStatus('error');
          setMessage(error.message || 'Failed to verify email. The link may be expired or invalid.');
          return;
        }

        if (data.session) {
          setStatus('success');
          setMessage('Email verified successfully! Redirecting...');

          // Redirect to home after a short delay
          setTimeout(() => {
            router.push('/');
          }, 2000);
        } else {
          setStatus('error');
          setMessage('No active session found. Please try logging in again.');
        }
      } catch (err: any) {
        console.error('Confirmation error:', err);
        setStatus('error');
        setMessage('An unexpected error occurred. Please try again.');
      }
    };

    confirmEmail();
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 bg-background">
      <motion.div
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        transition={transitions.spring}
        className="w-full max-w-md text-center"
      >
        {/* Icon */}
        <div className="flex justify-center mb-6">
          {status === 'loading' && (
            <Loader className="w-16 h-16 text-primary animate-spin" />
          )}
          {status === 'success' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', duration: 0.5 }}
            >
              <CheckCircle className="w-16 h-16 text-success" />
            </motion.div>
          )}
          {status === 'error' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', duration: 0.5 }}
            >
              <XCircle className="w-16 h-16 text-error" />
            </motion.div>
          )}
        </div>

        {/* Title */}
        <h1 className="text-3xl font-serif mb-4">
          {status === 'loading' && 'Verifying Email'}
          {status === 'success' && 'Email Verified!'}
          {status === 'error' && 'Verification Failed'}
        </h1>

        {/* Message */}
        <p className="text-secondary mb-8">{message}</p>

        {/* Action Buttons */}
        {status === 'error' && (
          <div className="space-y-3">
            <Button
              variant="primary"
              onClick={() => router.push('/login')}
              className="w-full"
            >
              Go to Login
            </Button>
            <Button
              variant="secondary"
              onClick={() => router.push('/')}
              className="w-full"
            >
              Back to Home
            </Button>
          </div>
        )}

        {status === 'success' && (
          <div className="text-sm text-secondary">
            Taking you to your dashboard...
          </div>
        )}
      </motion.div>
    </div>
  );
}
