'use client';

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <main className="w-full min-h-screen bg-background text-text-primary overflow-x-hidden">
      {children}
    </main>
  );
}
