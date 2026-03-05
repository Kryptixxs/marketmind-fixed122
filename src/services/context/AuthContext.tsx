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
const SECRET_SEQUENCE = 'vantage';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  
  // Use a ref to track the key sequence without triggering re-renders
  const keyBuffer = useRef<string>('');

  // Check for existing bypass on mount
  useEffect(() => {
    const bypass = sessionStorage.getItem(BYPASS_KEY);
    if (bypass === 'true') {
      setIsGuest(true);
    }
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

  // Secret Sequence Listener: typing 'vantage'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Append key to buffer
      keyBuffer.current += e.key.toLowerCase();
      
      // Keep buffer size manageable
      if (keyBuffer.current.length > SECRET_SEQUENCE.length) {
        keyBuffer.current = keyBuffer.current.slice(-SECRET_SEQUENCE.length);
      }

      // Check for match
      if (keyBuffer.current === SECRET_SEQUENCE) {
        console.log("[Auth] Institutional Bypass Triggered via Sequence");
        sessionStorage.setItem(BYPASS_KEY, 'true');
        setIsGuest(true);
        keyBuffer.current = ''; // Reset buffer
        router.push('/dashboard');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  // Protect private routes
  useEffect(() => {
    if (isLoading) return;
    
    const isPublicPage = pathname === '/' || pathname === '/login' || pathname === '/register';
    const isAuthenticated = !!user || isGuest;
    
    if (!isAuthenticated && !isPublicPage) {
      router.push('/login');
    } else if (isAuthenticated && (pathname === '/login' || pathname === '/register')) {
      router.push('/dashboard');
    }
  }, [user, isGuest, isLoading, pathname, router]);

  const signOut = useCallback(async () => {
    sessionStorage.removeItem(BYPASS_KEY);
    setIsGuest(false);
    await supabase.auth.signOut();
    router.push('/');
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, session, isLoading, isGuest, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);