'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

export const dynamic = 'force-dynamic';

export default function SubscriptionSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams?.get('session_id');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Give webhooks a moment to process
    // The subscription should be updated by the webhook handler
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <LoadingScreen messages={["Activating your subscription..."]} />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1625] via-[#2d1b3d] to-[#1a1625] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
          <div className="text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-white mb-4">Something Went Wrong</h1>
            <p className="text-gray-300 mb-6">{error}</p>
            <Button
              variant="primary"
              size="medium"
              onClick={() => router.push('/dashboard')}
              fullWidth
            >
              Return to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1625] via-[#2d1b3d] to-[#1a1625] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
        <div className="text-center">
          {/* Success Icon */}
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#F6D99F] to-[#d4b87c] flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-black"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              {/* Glow effect */}
              <div className="absolute inset-0 w-20 h-20 rounded-full bg-[#F6D99F] opacity-30 blur-xl animate-pulse" />
            </div>
          </div>

          {/* Success Message */}
          <h1 className="text-3xl font-bold text-white mb-3">
            Welcome to Premium!
          </h1>
          <p className="text-gray-300 mb-6">
            Your subscription has been activated successfully. You now have access to all premium features.
          </p>

          {/* Session ID (for debugging) */}
          {sessionId && (
            <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
              <p className="text-xs text-gray-400 mb-1">Session ID</p>
              <p className="text-xs text-gray-300 font-mono break-all">{sessionId}</p>
            </div>
          )}

          {/* What's Next */}
          <div className="mb-8 text-left bg-white/5 rounded-lg p-6 border border-white/10">
            <h2 className="text-lg font-semibold text-white mb-4">What's next?</h2>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-[#F6D99F] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-gray-300">Explore unlimited tarot and I Ching readings</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-[#F6D99F] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-gray-300">Try dream interpretation and enhanced horoscope</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-[#F6D99F] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-gray-300">Access synastry compatibility readings</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              variant="secondary"
              size="medium"
              onClick={() => router.push('/dashboard')}
              fullWidth
            >
              Go to Dashboard
            </Button>
            <Button
              variant="ghost"
              size="medium"
              onClick={() => router.push('/oracle')}
              fullWidth
            >
              Start a Reading
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
