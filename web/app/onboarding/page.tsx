'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store';

export default function OnboardingPage() {
  const router = useRouter();
  const { isAuthenticated, birthData } = useAppStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
    if (birthData) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, birthData, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold font-serif mb-8 text-center">
          Welcome to Ouros
        </h1>
        <p className="text-center text-secondary mb-8">
          Let's set up your birth chart to provide personalized cosmic insights
        </p>

        {/* Onboarding flow will be implemented here */}
        <div className="bg-card border border-border rounded-lg p-8">
          <p className="text-center text-secondary">
            Onboarding flow coming soon...
          </p>
        </div>
      </div>
    </div>
  );
}
