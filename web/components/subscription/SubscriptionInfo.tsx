'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ManageSubscriptionButton } from './ManageSubscriptionButton';
import { UpgradeButton } from '@/components/pricing/UpgradeButton';
import type { SubscriptionTier, SubscriptionStatus } from '@/types/subscription';

interface SubscriptionData {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

export function SubscriptionInfo() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSubscription() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setError('Not logged in');
          setLoading(false);
          return;
        }

        const { data, error: subError } = await supabase
          .from('subscription_state')
          .select('tier, status, current_period_end, cancel_at_period_end')
          .eq('user_id', user.id)
          .single();

        if (subError) {
          console.error('Error fetching subscription:', subError);
          setError('Failed to load subscription');
          setLoading(false);
          return;
        }

        setSubscription({
          tier: data.tier as SubscriptionTier,
          status: data.status as SubscriptionStatus,
          currentPeriodEnd: data.current_period_end,
          cancelAtPeriodEnd: data.cancel_at_period_end || false,
        });
        setLoading(false);
      } catch (err) {
        console.error('Error:', err);
        setError('Failed to load subscription');
        setLoading(false);
      }
    }

    fetchSubscription();
  }, []);

  if (loading) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
        <div className="animate-pulse">
          <div className="h-6 bg-white/10 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-white/10 rounded w-2/3 mb-2"></div>
          <div className="h-4 bg-white/10 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (!subscription) {
    return null;
  }

  const { tier, status, currentPeriodEnd, cancelAtPeriodEnd } = subscription;

  // Format renewal date
  const renewalDate = currentPeriodEnd
    ? new Date(currentPeriodEnd).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  // Determine status badge color and text
  const getStatusBadge = () => {
    switch (status) {
      case 'active':
        return { color: 'bg-green-500/20 text-green-300', text: 'Active' };
      case 'trial':
        return { color: 'bg-blue-500/20 text-blue-300', text: 'Trial' };
      case 'cancelled':
        return { color: 'bg-gray-500/20 text-gray-300', text: 'Cancelled' };
      case 'grace_period':
        return { color: 'bg-yellow-500/20 text-yellow-300', text: 'Payment Issue' };
      case 'expired':
        return { color: 'bg-red-500/20 text-red-300', text: 'Expired' };
      default:
        return { color: 'bg-gray-500/20 text-gray-300', text: status };
    }
  };

  const statusBadge = getStatusBadge();
  const isFree = tier === 'free';
  const isPaidTier = tier === 'premium' || tier === 'pro';

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">
            {tier === 'free' && 'Free Plan'}
            {tier === 'premium' && 'Premium Plan'}
            {tier === 'pro' && 'Pro Plan'}
          </h3>
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusBadge.color}`}>
            {statusBadge.text}
          </span>
        </div>
        {tier !== 'free' && (
          <div className="text-right">
            <div className="text-2xl font-bold text-white">
              {tier === 'premium' && '$9.99'}
              {tier === 'pro' && '$19.99'}
            </div>
            <div className="text-xs text-gray-400">per month</div>
          </div>
        )}
      </div>

      {/* Subscription Details */}
      {isPaidTier && (
        <div className="space-y-3 mb-6">
          {renewalDate && !cancelAtPeriodEnd && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Next billing date:</span>
              <span className="text-white font-medium">{renewalDate}</span>
            </div>
          )}

          {cancelAtPeriodEnd && renewalDate && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Access until:</span>
              <span className="text-white font-medium">{renewalDate}</span>
            </div>
          )}

          {cancelAtPeriodEnd && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
              <p className="text-sm text-yellow-300">
                Your subscription will end on {renewalDate}. You can reactivate anytime.
              </p>
            </div>
          )}

          {status === 'grace_period' && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
              <p className="text-sm text-yellow-300">
                There was an issue with your last payment. Please update your payment method to continue.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3">
        {isFree && (
          <>
            <UpgradeButton
              tier="premium"
              interval="monthly"
              variant="secondary"
              size="medium"
              fullWidth
            >
              Upgrade to Premium
            </UpgradeButton>
            <button
              onClick={() => window.location.href = '/pricing'}
              className="w-full text-sm text-gray-400 hover:text-white transition-colors"
            >
              View all plans
            </button>
          </>
        )}

        {isPaidTier && (
          <>
            <ManageSubscriptionButton
              variant="secondary"
              size="medium"
              fullWidth
            >
              Manage Subscription
            </ManageSubscriptionButton>
            <p className="text-xs text-gray-400 text-center">
              Update payment method, view invoices, or cancel
            </p>
          </>
        )}
      </div>

      {/* Features */}
      {isFree && (
        <div className="mt-6 pt-6 border-t border-white/10">
          <h4 className="text-sm font-semibold text-white mb-3">Free Plan Includes:</h4>
          <ul className="space-y-2 text-sm text-gray-300">
            <li className="flex items-start gap-2">
              <svg className="w-4 h-4 text-[#F6D99F] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              1 tarot/I Ching reading per day
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-4 h-4 text-[#F6D99F] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Basic natal chart
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-4 h-4 text-[#F6D99F] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              5 journal entries per month
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
