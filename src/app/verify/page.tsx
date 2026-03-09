import Link from 'next/link';

export default function VerifyPage() {
  return (
    <div className="min-h-screen bg-background text-text-primary flex items-center justify-center p-6">
      <div className="w-full max-w-md border border-border bg-surface/30 p-6 space-y-4">
        <h1 className="text-xl font-black">Verify your account</h1>
        <p className="text-xs text-text-secondary">If you used email verification or magic-link, complete verification and continue to app shell.</p>
        <div className="flex gap-2">
          <Link href="/app" className="px-3 py-2 bg-accent text-black text-xs font-bold">Open app shell</Link>
          <Link href="/login" className="px-3 py-2 border border-border text-xs">Return to login</Link>
        </div>
      </div>
    </div>
  );
}

