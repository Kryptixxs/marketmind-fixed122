'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

/**
 * Entity deep-link: /entity/PLTR redirects to terminal with INTEL module and symbol loaded.
 * The terminal's RouteSync will pick up the query params and dispatch.
 */
export default function EntityPage() {
  const params = useParams();
  const router = useRouter();
  const symbol = (params.symbol as string)?.toUpperCase();

  useEffect(() => {
    if (!symbol) return;
    router.replace(`/?entity=${encodeURIComponent(symbol)}&fn=INTEL`);
  }, [symbol, router]);

  return (
    <div className="flex items-center justify-center h-full text-text-tertiary text-sm">
      <span>Loading {symbol}...</span>
    </div>
  );
}
