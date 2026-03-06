'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global app error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-background text-text-primary min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md border border-negative/30 bg-surface rounded-md p-5">
          <h1 className="text-sm font-bold uppercase tracking-wider text-negative mb-2">
            Application Error
          </h1>
          <p className="text-[11px] text-text-secondary mb-4">
            A runtime error occurred while rendering this page.
          </p>
          <button
            onClick={reset}
            className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-sm bg-accent text-accent-text hover:bg-accent-muted transition-colors"
          >
            Retry
          </button>
        </div>
      </body>
    </html>
  );
}

