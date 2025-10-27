'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

interface ManageSubscriptionButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  children?: React.ReactNode;
}

export function ManageSubscriptionButton({
  variant = 'ghost',
  size = 'medium',
  fullWidth = false,
  children,
}: ManageSubscriptionButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleManageSubscription = async () => {
    setLoading(true);
    setError(null);

    try {
      // Call our API to create a customer portal session
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to open billing portal');
      }

      // Redirect to Stripe Customer Portal
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No portal URL returned');
      }
    } catch (err) {
      console.error('Manage subscription error:', err);
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
        onClick={handleManageSubscription}
        disabled={loading}
      >
        {children || 'Manage Subscription'}
      </Button>
      {error && (
        <p className="mt-2 text-sm text-red-400 text-center">{error}</p>
      )}
    </div>
  );
}
