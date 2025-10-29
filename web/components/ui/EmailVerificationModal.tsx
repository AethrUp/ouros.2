'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, X, CheckCircle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { useAppStore } from '@/store';

interface EmailVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
  message?: string;
}

export function EmailVerificationModal({
  isOpen,
  onClose,
  featureName,
  message,
}: EmailVerificationModalProps) {
  const { user, resendVerificationEmail } = useAppStore();
  const [isResending, setIsResending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleResendEmail = async () => {
    setIsResending(true);
    try {
      await resendVerificationEmail();
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 3000);
    } catch (error) {
      console.error('Failed to resend verification email:', error);
    } finally {
      setIsResending(false);
    }
  };

  const defaultMessage = featureName
    ? `Please verify your email to access ${featureName}`
    : 'Please verify your email to continue';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="text-center py-4">
        <AnimatePresence mode="wait">
          {showSuccess ? (
            <motion.div
              key="success"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', duration: 0.5 }}
            >
              <div className="flex justify-center mb-4">
                <CheckCircle className="w-16 h-16 text-success" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Email Sent!</h3>
              <p className="text-secondary">
                Check your inbox for the verification link
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="prompt"
              initial={{ opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              {/* Icon */}
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="w-8 h-8 text-primary" />
                </div>
              </div>

              {/* Title */}
              <h3 className="text-xl font-semibold mb-2">
                Email Verification Required
              </h3>

              {/* Message */}
              <p className="text-secondary mb-6">
                {message || defaultMessage}
              </p>

              {/* User Email */}
              {user?.email && (
                <div className="bg-surface/50 rounded-lg p-3 mb-6">
                  <p className="text-sm text-secondary mb-1">
                    Verification email sent to:
                  </p>
                  <p className="text-sm font-medium">{user.email}</p>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-3">
                <Button
                  variant="primary"
                  onClick={handleResendEmail}
                  loading={isResending}
                  className="w-full"
                >
                  {isResending ? 'Sending...' : 'Resend Verification Email'}
                </Button>

                <Button
                  variant="secondary"
                  onClick={onClose}
                  className="w-full"
                >
                  Close
                </Button>
              </div>

              {/* Help Text */}
              <p className="text-xs text-secondary mt-4">
                Didn't receive the email? Check your spam folder or try resending.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  );
}
