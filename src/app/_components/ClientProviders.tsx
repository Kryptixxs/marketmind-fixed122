'use client';

import { TunnelProvider } from '@/features/Terminal/context/TunnelContext';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return <TunnelProvider>{children}</TunnelProvider>;
}
