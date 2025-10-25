'use client';

import React from 'react';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

export default function TestLoadingPage() {
  return (
    <div className="min-h-screen bg-background">
      <LoadingScreen context="natal-chart" />
    </div>
  );
}
