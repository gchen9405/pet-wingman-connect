import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { useAuthStore } from '@/stores/useAuthStore';
import { useEffect } from 'react';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

// Mock data for development
const mockUser: User = {
  id: 'mock-user-id',
  email: 'user@example.com',
  aud: 'authenticated',
  role: 'authenticated',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  app_metadata: {},
  user_metadata: {},
} as User;

const mockSession: Session = {
  access_token: 'mock-token',
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: Date.now() / 1000 + 3600,
  refresh_token: 'mock-refresh',
  user: mockUser,
} as Session;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const signUp = async (email: string, password: string) => {
  if (USE_MOCKS) {
    await delay(1000);
    return { user: mockUser, session: mockSession, error: null };
  }

  const redirectUrl = `${window.location.origin}/`;
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectUrl
    }
  });

  return { user: data.user, session: data.session, error };
};

export const signIn = async (email: string, password: string) => {
  if (USE_MOCKS) {
    await delay(1000);
    return { user: mockUser, session: mockSession, error: null };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return { user: data.user, session: data.session, error };
};

export const signOut = async () => {
  if (USE_MOCKS) {
    await delay(500);
    return { error: null };
  }

  const { error } = await supabase.auth.signOut();
  return { error };
};

export const useSession = () => {
  const { user, session, setAuth, clearAuth } = useAuthStore();

  useEffect(() => {
    if (USE_MOCKS) {
      // For mock mode, simulate being logged out initially
      return;
    }

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setAuth(session?.user ?? null, session);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuth(session?.user ?? null, session);
    });

    return () => subscription.unsubscribe();
  }, [setAuth]);

  return { user, session, isLoading: false };
};