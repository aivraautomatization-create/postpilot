'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body className="bg-black text-white flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-medium">Something went wrong</h2>
          <button
            onClick={reset}
            className="px-4 py-2 bg-white text-black rounded-lg text-sm font-medium"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
