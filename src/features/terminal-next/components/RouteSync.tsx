'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTerminalStore } from '../store/TerminalStore';

/**
 * Syncs URL query params (?entity=PLTR&fn=INTEL) to terminal store for deep-linking.
 * Used by /entity/[symbol] redirect.
 */
export function RouteSync() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { dispatch } = useTerminalStore();
  const appliedRef = useRef(false);

  useEffect(() => {
    const entity = searchParams.get('entity');
    const fn = searchParams.get('fn');
    const country = searchParams.get('country') ?? undefined;
    const date = searchParams.get('date') ?? undefined;
    if (!entity || appliedRef.current) return;

    appliedRef.current = true;
    dispatch({ type: 'SET_SYMBOL', payload: entity });
    dispatch({ type: 'SET_ACTIVE_FUNCTION', payload: (fn?.toUpperCase() as 'INTEL') || 'INTEL' });
    dispatch({ type: 'SET_INTEL_FILTERS', payload: country || date ? { country, date } : undefined });
    dispatch({ type: 'SET_COMMAND', payload: `${entity} INTEL GO` });
    dispatch({ type: 'EXECUTE_COMMAND', payload: `${entity} INTEL GO` });

    router.replace('/', { scroll: false });
  }, [searchParams, dispatch, router]);

  return null;
}
