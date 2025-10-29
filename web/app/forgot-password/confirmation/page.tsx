'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui';
import { fadeInUp, staggerContainer, staggerItem, transitions } from '@/lib/animations';

export default function ForgotPasswordConfirmationPage() {
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
          {/* Success Icon */}
          <motion.div
            variants={staggerItem}
            className="flex justify-center mb-6"
          >
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-primary" />
              </div>
            </div>
          </motion.div>

          <motion.h1
            variants={staggerItem}
            className="text-3xl font-serif"
          >
            Check Your Email
          </motion.h1>

          <motion.p variants={staggerItem} className="mt-4 text-sm text-secondary/70 px-4">
            We've sent a password reset link to your email address. Please check your inbox and follow the instructions to reset your password.
          </motion.p>
        </motion.div>

        {/* Additional Information */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-6"
        >
          {/* Info Box */}
          <motion.div
            variants={staggerItem}
            className="rounded-lg bg-secondary/5 border border-border p-6"
          >
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-sm space-y-2">
                <p className="text-white">Didn't receive the email?</p>
                <ul className="text-secondary/70 space-y-1 list-disc list-inside">
                  <li>Check your spam or junk folder</li>
                  <li>Make sure you entered the correct email address</li>
                  <li>Wait a few minutes for the email to arrive</li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div variants={staggerItem} className="space-y-3">
            <Link href="/forgot-password" className="block">
              <Button
                variant="secondary"
                size="large"
                className="w-full"
              >
                Try Another Email
              </Button>
            </Link>

            <Link href="/login" className="block">
              <Button
                variant="ghost"
                size="large"
                className="w-full"
              >
                Back to Login
              </Button>
            </Link>
          </motion.div>

          {/* Help Text */}
          <motion.div variants={staggerItem} className="text-center">
            <p className="text-xs text-secondary/50">
              The reset link will expire in 24 hours for security reasons.
            </p>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
