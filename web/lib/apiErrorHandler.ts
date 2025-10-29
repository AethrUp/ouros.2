import * as Sentry from '@sentry/nextjs';
import { NextResponse } from 'next/server';

export interface ApiError {
  message: string;
  statusCode: number;
  code?: string;
  details?: unknown;
}

export class ApiException extends Error {
  statusCode: number;
  code?: string;
  details?: unknown;

  constructor(message: string, statusCode: number = 500, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiException';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

/**
 * Wraps an API route handler with error handling and Sentry logging
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error);
    }
  }) as T;
}

/**
 * Handles API errors and sends them to Sentry
 */
export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error);

  if (error instanceof ApiException) {
    // Log to Sentry with context
    Sentry.captureException(error, {
      level: error.statusCode >= 500 ? 'error' : 'warning',
      tags: {
        api_error: true,
        error_code: error.code || 'unknown',
      },
      extra: {
        statusCode: error.statusCode,
        details: error.details,
      },
    });

    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        details: error.details,
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof Error) {
    // Log unexpected errors to Sentry
    Sentry.captureException(error, {
      level: 'error',
      tags: {
        api_error: true,
        unexpected: true,
      },
    });

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }

  // Unknown error type
  Sentry.captureMessage('Unknown API error type', {
    level: 'error',
    extra: { error },
  });

  return NextResponse.json(
    { error: 'An unexpected error occurred' },
    { status: 500 }
  );
}

/**
 * Helper to log info to Sentry
 */
export function logToSentry(message: string, level: 'info' | 'warning' | 'error' = 'info', extra?: Record<string, unknown>) {
  Sentry.captureMessage(message, {
    level,
    extra,
  });
}
