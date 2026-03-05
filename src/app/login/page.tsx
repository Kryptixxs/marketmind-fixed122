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
      <div className="h-8 border-b border-border bg-surface flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-positive animate-pulse" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-text-secondary">Gateway: US-EAST-1</span>
          </div>
          <span className="text-[9px] font-mono text-text-tertiary">LATENCY: 24ms</span>
        </div>
        <div className="flex items-center gap-4 text-[9px] font-mono text-text-tertiary">
          <span>{systemTime} UTC</span>
          <span className="text-accent font-bold">VANTAGE_OS v4.0.2</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 relative">
        {/* Background Decorative Elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="w-full max-w-md z-10">
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 bg-accent/10 border border-accent/20 rounded-lg flex items-center justify-center text-accent mb-4 shadow-lg shadow-accent/5">
              <Terminal size={24} />
            </div>
            <h1 className="text-2xl font-black tracking-tighter text-text-primary uppercase">Terminal Access</h1>
            <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-[0.2em] mt-1">Secure Institutional Gateway</p>
          </div>

          <div className="bg-surface border border-border rounded-sm shadow-2xl overflow-hidden">
            <div className="panel-header px-4 py-2 bg-surface-highlight border-b border-border">
              <span className="text-[9px] font-bold">Authentication Required</span>
              <ShieldCheck size={12} className="text-accent" />
            </div>

            <form onSubmit={handleLogin} className="p-8 space-y-5">
              {error && (
                <div className="p-3 bg-negative/10 border border-negative/30 rounded-sm flex items-start gap-2 text-negative text-xs animate-in fade-in slide-in-from-top-1">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Institutional ID (Email)</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-background border border-border rounded-sm pl-10 pr-4 py-3 text-xs text-text-primary focus:border-accent outline-none transition-all font-mono"
                    placeholder="trader@vantage.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Passphrase</label>
                  <button 
                    type="button"
                    onClick={() => handlePlaceholderAction('Password Recovery')}
                    className="text-[9px] font-bold text-accent hover:underline uppercase tracking-tighter"
                  >
                    Lost Access?
                  </button>
                </div>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-background border border-border rounded-sm pl-10 pr-4 py-3 text-xs text-text-primary focus:border-accent outline-none transition-all font-mono"
                    placeholder="••••••••••••"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full h-12 bg-accent text-accent-text font-bold uppercase tracking-widest rounded-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 mt-2 shadow-lg shadow-accent/10 active:scale-[0.98]"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <>Establish Connection <ArrowRight size={18} /></>}
              </button>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/50"></div></div>
                <div className="relative flex justify-center text-[8px] uppercase font-bold tracking-widest"><span className="bg-surface px-2 text-text-tertiary">Alternative Methods</span></div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button 
                  type="button"
                  onClick={() => handlePlaceholderAction('Institutional SSO')}
                  className="flex items-center justify-center gap-2 py-2 bg-surface-highlight border border-border rounded-sm text-[9px] font-bold uppercase text-text-secondary hover:text-text-primary hover:bg-white/5 transition-all"
                >
                  <Globe size={12} /> SSO
                </button>
                <button 
                  type="button"
                  onClick={() => handlePlaceholderAction('Hardware MFA')}
                  className="flex items-center justify-center gap-2 py-2 bg-surface-highlight border border-border rounded-sm text-[9px] font-bold uppercase text-text-secondary hover:text-text-primary hover:bg-white/5 transition-all"
                >
                  <Fingerprint size={12} /> Key
                </button>
              </div>
            </form>

            <div className="bg-surface-highlight/50 border-t border-border p-4 text-center">
              <p className="text-[10px] text-text-tertiary font-medium">
                No active allocation? <Link href="/register" className="text-text-primary font-bold hover:text-accent transition-colors underline underline-offset-4">Apply for Access</Link>
              </p>
            </div>
          </div>

          {/* Security Footer */}
          <div className="mt-8 flex items-center justify-center gap-6 opacity-30 grayscale hover:grayscale-0 transition-all duration-500">
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={14} />
              <span className="text-[8px] font-bold uppercase tracking-widest">AES-256 Encrypted</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Cpu size={14} />
              <span className="text-[8px] font-bold uppercase tracking-widest">Hardware Isolated</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <footer className="h-10 border-t border-border bg-surface flex items-center justify-center px-6 shrink-0">
        <p className="text-[9px] text-text-tertiary font-bold uppercase tracking-[0.3em]">© 2026 Vantage Terminal // All Rights Reserved</p>
      </footer>
    </div>
  );
}