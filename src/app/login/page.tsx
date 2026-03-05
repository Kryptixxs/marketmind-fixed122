'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Terminal, 
  Lock, 
  Mail, 
  ArrowRight, 
  Loader2, 
  AlertCircle, 
  ShieldCheck, 
  Fingerprint, 
  Globe,
  Cpu
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [systemTime, setSystemTime] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      setSystemTime(new Date().toUTCString().split(' ')[4]);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  };

  const handlePlaceholderAction = (feature: string) => {
    alert(`${feature} is currently restricted to Enterprise Tier accounts. Please contact your desk administrator.`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-accent/30 selection:text-accent overflow-hidden">
      {/* Top Status Bar */}
      <div className="h-10 border-b border-border bg-surface flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-positive animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Gateway: US-EAST-1</span>
          </div>
          <span className="text-[10px] font-mono text-text-tertiary">LATENCY: 24ms</span>
        </div>
        <div className="flex items-center gap-6 text-[10px] font-mono text-text-tertiary">
          <span>{systemTime} UTC</span>
          <span className="text-accent font-bold">VANTAGE_OS v4.0.2</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 relative">
        {/* Background Decorative Elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="w-full max-w-lg z-10">
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 bg-accent/10 border border-accent/20 rounded-xl flex items-center justify-center text-accent mb-6 shadow-xl shadow-accent/5">
              <Terminal size={32} />
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-text-primary uppercase">Terminal Access</h1>
            <p className="text-xs font-bold text-text-tertiary uppercase tracking-[0.3em] mt-2">Secure Institutional Gateway</p>
          </div>

          <div className="bg-surface border border-border rounded-md shadow-2xl overflow-hidden">
            <div className="panel-header px-6 py-3 bg-surface-highlight border-b border-border flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider">Authentication Required</span>
              <ShieldCheck size={16} className="text-accent" />
            </div>

            <form onSubmit={handleLogin} className="p-10 space-y-6">
              {error && (
                <div className="p-4 bg-negative/10 border border-negative/30 rounded-sm flex items-start gap-3 text-negative text-sm animate-in fade-in slide-in-from-top-1">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-3">
                <label className="text-xs font-bold text-text-tertiary uppercase tracking-widest">Institutional ID (Email)</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" />
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-background border border-border rounded-sm pl-12 pr-4 py-4 text-sm text-text-primary focus:border-accent outline-none transition-all font-mono"
                    placeholder="trader@vantage.com"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-text-tertiary uppercase tracking-widest">Passphrase</label>
                  <button 
                    type="button"
                    onClick={() => handlePlaceholderAction('Password Recovery')}
                    className="text-[10px] font-bold text-accent hover:underline uppercase tracking-widest"
                  >
                    Lost Access?
                  </button>
                </div>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" />
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-background border border-border rounded-sm pl-12 pr-4 py-4 text-sm text-text-primary focus:border-accent outline-none transition-all font-mono"
                    placeholder="••••••••••••"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full h-14 bg-accent text-accent-text font-bold uppercase tracking-[0.2em] rounded-sm hover:opacity-90 transition-all flex items-center justify-center gap-3 mt-4 shadow-lg shadow-accent/10 active:scale-[0.99]"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : <>Establish Connection <ArrowRight size={20} /></>}
              </button>

              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/50"></div></div>
                <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-[0.3em]"><span className="bg-surface px-4 text-text-tertiary">Alternative Methods</span></div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  type="button"
                  onClick={() => handlePlaceholderAction('Institutional SSO')}
                  className="flex items-center justify-center gap-3 py-3 bg-surface-highlight border border-border rounded-sm text-xs font-bold uppercase text-text-secondary hover:text-text-primary hover:bg-white/5 transition-all"
                >
                  <Globe size={16} /> SSO
                </button>
                <button 
                  type="button"
                  onClick={() => handlePlaceholderAction('Hardware MFA')}
                  className="flex items-center justify-center gap-3 py-3 bg-surface-highlight border border-border rounded-sm text-xs font-bold uppercase text-text-secondary hover:text-text-primary hover:bg-white/5 transition-all"
                >
                  <Fingerprint size={16} /> Key
                </button>
              </div>
            </form>

            <div className="bg-surface-highlight/50 border-t border-border p-6 text-center">
              <p className="text-xs text-text-tertiary font-medium">
                No active allocation? <Link href="/register" className="text-text-primary font-bold hover:text-accent transition-colors underline underline-offset-4">Apply for Access</Link>
              </p>
            </div>
          </div>

          {/* Security Footer */}
          <div className="mt-12 flex items-center justify-center gap-10 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} />
              <span className="text-[10px] font-bold uppercase tracking-widest">AES-256 Encrypted</span>
            </div>
            <div className="flex items-center gap-2">
              <Cpu size={18} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Hardware Isolated</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <footer className="h-12 border-t border-border bg-surface flex items-center justify-center px-8 shrink-0">
        <p className="text-[10px] text-text-tertiary font-bold uppercase tracking-[0.4em]">© 2026 Vantage Terminal // All Rights Reserved</p>
      </footer>
    </div>
  );
}