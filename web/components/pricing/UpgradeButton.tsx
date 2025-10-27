'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import type { StripeTier, StripeBillingInterval } from '@/lib/stripe/prices';

interface UpgradeButtonProps {
  tier: StripeTier;
  interval: StripeBillingInterval;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  children?: React.ReactNode;
}

export function UpgradeButton({
  tier,
  interval,
  variant = 'secondary',
  size = 'medium',
  fullWidth = false,
  children,
}: UpgradeButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = async () => {
    setLoading(true);
    setError(null);

    try {
      // Call our API to create a checkout session
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tier, interval }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err) {
      console.error('Upgrade error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <Button
        variant={variant}
        size={size}
        fullWidth={fullWidth}
        loading={loading}
        onClick={handleUpgrade}
        disabled={loading}
      >
        {children || `Upgrade to ${tier.charAt(0).toUpperCase() + tier.slice(1)}`}
      </Button>
      {error && (
        <p className="mt-2 text-sm text-red-400 text-center">{error}</p>
      )}
    </div>
  );
}
