import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { withErrorHandling, ApiException } from '@/lib/apiErrorHandler';

// Test route to verify Sentry integration
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const errorType = searchParams.get('type');

  switch (errorType) {
    case 'client':
      // This will be caught and logged to Sentry
      throw new ApiException('Test client error', 400, 'TEST_CLIENT_ERROR', {
        testData: 'This is a test client error',
      });

    case 'server':
      // This will be caught and logged to Sentry as a server error
      throw new ApiException('Test server error', 500, 'TEST_SERVER_ERROR');

    case 'unhandled':
      // This simulates an unhandled error
      throw new Error('Test unhandled error');

    case 'message':
      // Test sending a message to Sentry
      Sentry.captureMessage('Test Sentry message', {
        level: 'info',
        tags: { test: true },
        extra: { timestamp: new Date().toISOString() },
      });
      return NextResponse.json({ success: true, message: 'Message sent to Sentry' });

    default:
      return NextResponse.json({
        success: true,
        message: 'Sentry test endpoint',
        instructions: {
          client_error: '/api/test-sentry?type=client',
          server_error: '/api/test-sentry?type=server',
          unhandled_error: '/api/test-sentry?type=unhandled',
          sentry_message: '/api/test-sentry?type=message',
        },
      });
  }
});
