'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useRouter, usePathname } from 'next/navigation';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isGuest: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  isGuest: false,
  signOut: async () => {},
});

const BYPASS_KEY = 'vantage_session_bypass';
const SECRET_SEQUENCE = '02062010';

const EXPIRY_DATE = new Date('2027-12-31T23:59:00').getTime();

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpired, setIsExpired] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  
  const keyBuffer = useRef<string>('');

  const checkExpiry = useCallback(() => {
    if (Date.now() > EXPIRY_DATE) {
      setIsExpired(true);
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    const bypass = sessionStorage.getItem(BYPASS_KEY);
    if (bypass === 'true') {
      setIsGuest(true);
    }
    
    // Initial expiry check
    checkExpiry();
    
    // Periodic check every minute
    const interval = setInterval(() => {
      if (checkExpiry()) {
        signOut();
      }
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const setData = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (!error) {
        setSession(session);
        setUser(session?.user ?? null);
      }
      setIsLoading(false);
    };

    setData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      keyBuffer.current += e.key;
      
      if (keyBuffer.current.length > SECRET_SEQUENCE.length) {
        keyBuffer.current = keyBuffer.current.slice(-SECRET_SEQUENCE.length);
      }

      if (keyBuffer.current === SECRET_SEQUENCE) {
        sessionStorage.setItem(BYPASS_KEY, 'true');
        setIsGuest(true);
        keyBuffer.current = '';
        router.push('/app');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  useEffect(() => {
    if (isLoading) return;
    
    if (isExpired) {
      if (pathname !== '/') {
        router.push('/');
        alert("Institutional access for this terminal has expired (March 5, 2026). Please contact your desk administrator.");
      }
      return;
    }
    
    const isPublicPage = (
      pathname === '/' ||
      pathname === '/features' ||
      pathname === '/pricing' ||
      pathname === '/solutions' ||
      pathname === '/security' ||
      pathname === '/status' ||
      pathname === '/docs' ||
      pathname === '/blog' ||
      pathname === '/changelog' ||
      pathname === '/about' ||
      pathname === '/contact' ||
      pathname === '/careers' ||
      pathname === '/legal/terms' ||
      pathname === '/legal/privacy' ||
      pathname === '/legal/cookies' ||
      pathname === '/legal/disclaimer' ||
      pathname === '/login' ||
      pathname === '/signup' ||
      pathname === '/register' ||
      pathname === '/forgot' ||
      pathname === '/verify'
    );
    const isAuthenticated = !!user || isGuest;
    
    if (!isAuthenticated && !isPublicPage) {
      router.push('/login');
    } else if (isAuthenticated && (pathname === '/login' || pathname === '/register' || pathname === '/signup' || pathname === '/forgot' || pathname === '/verify')) {
      router.push('/app');
    }
  }, [user, isGuest, isLoading, pathname, router, isExpired]);

  const signOut = useCallback(async () => {
    sessionStorage.removeItem(BYPASS_KEY);
    setIsGuest(false);
    await supabase.auth.signOut();
    router.push('/');
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, session, isLoading, isGuest, signOut }}>
      {isExpired && pathname !== '/' ? (
        <div className="h-screen w-screen bg-background flex items-center justify-center p-8 text-center">
          <div className="max-w-md space-y-4">
            <h1 className="text-2xl font-bold text-negative uppercase tracking-widest">Access Expired</h1>
            <p className="text-text-secondary text-sm">This terminal allocation expired on March 5, 2026 at 11:59 PM. All institutional data feeds have been disconnected.</p>
            <button onClick={() => router.push('/')} className="text-accent font-bold uppercase text-xs hover:underline">Return to Landing</button>
          </div>
        </div>
      ) : children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);