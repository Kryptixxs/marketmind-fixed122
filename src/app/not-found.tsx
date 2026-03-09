import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-text-primary flex items-center justify-center p-6">
      <div className="max-w-xl border border-border bg-surface/20 p-6 text-center">
        <h1 className="text-3xl font-black">404</h1>
        <p className="text-sm text-text-secondary mt-2">Page not found. Try the app launchpad, docs, or public status page.</p>
        <div className="mt-4 flex justify-center gap-2 text-xs">
          <Link href="/" className="px-3 py-1 border border-border">Home</Link>
          <Link href="/app" className="px-3 py-1 border border-border">App</Link>
          <Link href="/docs" className="px-3 py-1 border border-border">Docs</Link>
          <Link href="/status" className="px-3 py-1 border border-border">Status</Link>
        </div>
      </div>
    </div>
  );
}

