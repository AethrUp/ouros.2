'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

// This component ensures Sentry is initialized on the client
export function SentryInit() {
  useEffect(() => {
    // Sentry should already be initialized via sentry.client.config.ts
    // But in case it's not (Turbopack dev mode issue), we'll verify
    if (!Sentry.isInitialized()) {
      console.warn('Sentry was not initialized via config, initializing now...');
      Sentry.init({
        dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "https://a22af884df58e45afa8177e9dfceb38d@o4510267494105088.ingest.us.sentry.io/4510267495088128",
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1,
        debug: process.env.NODE_ENV === 'development',
        environment: process.env.NODE_ENV || 'development',
        replaysOnErrorSampleRate: 1.0,
        replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0.5,
        integrations: [
          Sentry.replayIntegration({
            maskAllText: true,
            blockAllMedia: true,
          }),
        ],
      });
      console.log('Sentry initialized manually');
    } else {
      console.log('Sentry is already initialized');
    }
  }, []);

  return null;
}
