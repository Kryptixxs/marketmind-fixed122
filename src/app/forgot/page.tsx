import Link from 'next/link';

export default function ForgotPage() {
  return (
    <div className="min-h-screen bg-background text-text-primary flex items-center justify-center p-6">
      <div className="w-full max-w-md border border-border bg-surface/30 p-6 space-y-4">
        <h1 className="text-xl font-black">Recover access</h1>
        <p className="text-xs text-text-secondary">Password recovery and magic-link resets are handled through institutional support in v1.</p>
        <input placeholder="work email" className="w-full bg-background border border-border p-2 text-xs" />
        <button className="w-full bg-accent text-black text-xs font-bold py-2">Request recovery</button>
        <div className="text-xs text-text-secondary">You can also <Link href="/contact" className="text-accent hover:underline">contact support</Link>.</div>
      </div>
    </div>
  );
}

