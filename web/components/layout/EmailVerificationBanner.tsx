'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X, Mail } from 'lucide-react';
import { Button } from '@/components/ui';
import { useAppStore } from '@/store';

export function EmailVerificationBanner() {
  const { user, resendVerificationEmail } = useAppStore();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Don't show banner if user is verified or banner is dismissed
  if (!user || user.emailVerified || isDismissed) {
    return null;
  }

  const handleResendEmail = async () => {
    setIsResending(true);
    try {
      await resendVerificationEmail();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    } catch (error) {
      console.error('Failed to resend verification email:', error);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-amber-500/90 to-orange-500/90 backdrop-blur-sm"
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Icon and Message */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <AlertCircle className="w-5 h-5 text-white flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">
                  Please verify your email address
                </p>
                <p className="text-xs text-white/90 mt-0.5">
                  Check your inbox for a verification link. Some features are limited until verified.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {showSuccess ? (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex items-center gap-1.5 text-sm text-white bg-white/20 px-3 py-1.5 rounded-lg"
                >
                  <Mail className="w-4 h-4" />
                  <span>Email sent!</span>
                </motion.div>
              ) : (
                <Button
                  variant="secondary"
                  size="small"
                  onClick={handleResendEmail}
                  loading={isResending}
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  {isResending ? 'Sending...' : 'Resend Email'}
                </Button>
              )}

              <button
                onClick={() => setIsDismissed(true)}
                className="p-1 hover:bg-white/20 rounded transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
