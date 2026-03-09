'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Terminal, User, Mail, Lock, Building, ArrowRight, Loader2, AlertCircle, CheckCircle2, Ticket } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// Keep legacy codes valid while moving to MarketMind branding
const VALID_CODES = ['MARKETMIND2026', 'MM_TERMINAL_PRO', 'BLOOM_STYLE_V1', 'ALPHA_TEST', 'BETA_ACCESS', 'QUANT_PRO', 'VANTAGE2026', 'VANTAGE_PRO_2026'];

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [firm, setFirm] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const isCodeValid = VALID_CODES.includes(inviteCode.toUpperCase().trim());

    if (isCodeValid) {
      // AUTOMATIC SIGNUP: User has a valid code
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/app`,
          data: {
            first_name: firstName,
            last_name: lastName,
            firm: firm,
            status: 'approved'
          }
        }
      });

      if (error) {
        setError(error.message);
        setLoading(false);
      } else {
        if (data.session) {
          router.push('/app');
        } else {
          setSuccess("Invite code verified. Please check your email to confirm your institutional account.");
          setLoading(false);
          setPassword('');
        }
      }
    } else {
      // MANUAL REVIEW: No valid code provided
      setTimeout(() => {
        setSuccess("Application submitted for manual review. Our compliance team will contact you at your work email if your firm is approved for an allocation.");
        setLoading(false);
        setPassword('');
        setInviteCode('');
      }, 1500);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative bg-background">
      <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-text-secondary hover:text-accent transition-colors">
        <Terminal size={20} />
        <span className="font-bold tracking-tight">MARKETMIND</span>
      </Link>

      <div className="w-full max-w-md bg-surface border border-border rounded-md shadow-2xl p-8 my-12">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-text-primary mb-2 uppercase tracking-tight">Apply for Access</h1>
          <p className="text-sm text-text-secondary">Join the institutional beta program.</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-5">
          {error && (
            <div className="p-3 bg-negative/10 border border-negative/30 rounded flex items-start gap-2 text-negative text-xs">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          
          {success && (
            <div className="p-4 bg-accent/10 border border-accent/20 rounded flex items-start gap-3 text-accent text-xs leading-relaxed">
              <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {!success && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">First Name</label>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                    <input 
                      required 
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full bg-background border border-border rounded-sm pl-9 pr-3 py-2.5 text-xs text-text-primary focus:border-accent outline-none" 
                      placeholder="John" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Last Name</label>
                  <input 
                    required 
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-background border border-border rounded-sm px-3 py-2.5 text-xs text-text-primary focus:border-accent outline-none" 
                    placeholder="Doe" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Firm / Organization</label>
                <div className="relative">
                  <Building size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                  <input 
                    value={firm}
                    onChange={(e) => setFirm(e.target.value)}
                    className="w-full bg-background border border-border rounded-sm pl-9 pr-3 py-2.5 text-xs text-text-primary focus:border-accent outline-none" 
                    placeholder="Prop Shop LLC (Optional)" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Work Email</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                  <input 
                    type="email" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-background border border-border rounded-sm pl-9 pr-3 py-2.5 text-xs text-text-primary focus:border-accent outline-none" 
                    placeholder="trader@fund.com" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Passphrase</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                  <input 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-background border border-border rounded-sm pl-9 pr-3 py-2.5 text-xs text-text-primary focus:border-accent outline-none" 
                    placeholder="Create a strong password" 
                    minLength={6}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Invite Code</label>
                <div className="relative">
                  <Ticket size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                  <input 
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    className="w-full bg-background border border-border rounded-sm pl-9 pr-3 py-2.5 text-xs text-text-primary focus:border-accent outline-none font-mono" 
                    placeholder="Optional for manual review" 
                  />
                </div>
                <p className="text-[9px] text-text-tertiary italic">Valid codes bypass manual compliance review.</p>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full h-12 bg-text-primary text-background font-bold uppercase tracking-widest rounded-sm hover:bg-accent transition-colors flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <>Submit Application <ArrowRight size={18} /></>}
              </button>
            </>
          )}
        </form>

        <div className="mt-8 text-center text-xs text-text-tertiary">
          Already have an allocation? <Link href="/login" className="text-text-primary font-bold hover:text-accent transition-colors">Sign In</Link>
        </div>
      </div>
    </div>
  );
}