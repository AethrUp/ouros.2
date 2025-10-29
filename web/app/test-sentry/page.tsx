'use client';

import { useState } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function SentryTestPage() {
  const [result, setResult] = useState<string>('');

  const testClientError = () => {
    try {
      throw new Error('Test client-side error');
    } catch (error) {
      Sentry.captureException(error);
      setResult('Client error sent to Sentry!');
    }
  };

  const testApiError = async (type: string) => {
    try {
      const response = await fetch(`/api/test-sentry?type=${type}`);
      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      Sentry.captureException(error);
      setResult('Error calling API: ' + (error as Error).message);
    }
  };

  const testMessage = () => {
    Sentry.captureMessage('Test message from client', {
      level: 'info',
      tags: { source: 'test-page' },
    });
    setResult('Message sent to Sentry!');
  };

  const testUnhandledError = () => {
    // This will be caught by the ErrorBoundary
    throw new Error('Unhandled client error - will be caught by ErrorBoundary');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Sentry Integration Test
          </h1>

          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold mb-3">Client-Side Tests</h2>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={testClientError}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Test Client Error
                </button>
                <button
                  onClick={testMessage}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Send Test Message
                </button>
                <button
                  onClick={testUnhandledError}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Test Unhandled Error (ErrorBoundary)
                </button>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">API Tests</h2>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => testApiError('client')}
                  className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                >
                  Test API Client Error (400)
                </button>
                <button
                  onClick={() => testApiError('server')}
                  className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
                >
                  Test API Server Error (500)
                </button>
                <button
                  onClick={() => testApiError('unhandled')}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Test Unhandled API Error
                </button>
                <button
                  onClick={() => testApiError('message')}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                  Send API Message
                </button>
              </div>
            </div>

            {result && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">Result:</h3>
                <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
                  {result}
                </pre>
              </div>
            )}

            <div className="mt-6 p-4 bg-blue-50 rounded">
              <h3 className="font-semibold text-blue-900 mb-2">Instructions:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                <li>Click any button to test error reporting</li>
                <li>Check your Sentry dashboard to see the errors</li>
                <li>Errors should appear within a few seconds</li>
                <li>The "Unhandled Error" button will crash the page (demonstrating ErrorBoundary)</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
