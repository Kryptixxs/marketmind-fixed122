'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Terminal, Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Mock authentication delay
    setTimeout(() => {
      router.push('/dashboard');
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-text-secondary hover:text-accent transition-colors">
        <Terminal size={20} />
        <span className="font-bold tracking-tight">VANTAGE</span>
      </Link>

      <div className="w-full max-w-md bg-surface border border-border rounded-md shadow-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-text-primary mb-2">Terminal Access</h1>
          <p className="text-sm text-text-secondary">Authenticate to establish secure connection.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-text-tertiary uppercase tracking-wider">Institutional Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
              <input 
                type="email" 
                required
                className="w-full bg-background border border-border rounded-sm pl-10 pr-4 py-3 text-sm text-text-primary focus:border-accent outline-none transition-colors"
                placeholder="trader@fund.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-text-tertiary uppercase tracking-wider">Passphrase</label>
              <Link href="#" className="text-xs text-accent hover:underline">Reset?</Link>
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
              <input 
                type="password" 
                required
                className="w-full bg-background border border-border rounded-sm pl-10 pr-4 py-3 text-sm text-text-primary focus:border-accent outline-none transition-colors"
                placeholder="••••••••••••"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full h-12 bg-accent text-accent-text font-bold uppercase tracking-widest rounded-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 mt-4"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <>Connect <ArrowRight size={18} /></>}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-text-tertiary">
          No active allocation? <Link href="/register" className="text-text-primary font-bold hover:text-accent transition-colors">Apply for Access</Link>
        </div>
      </div>
    </div>
  );
}