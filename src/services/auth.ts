import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { useAuthStore } from '@/stores/useAuthStore';
import { useEffect } from 'react';
import type { Database } from '@/integrations/supabase/types';

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

  // If signup is successful and user is confirmed immediately (e.g., in development)
  if (data.user && data.session && !error) {
    await createUserProfile(data.user);
  }

  return { user: data.user, session: data.session, error };
};

// Create user profile in the database
const createUserProfile = async (user: User) => {
  try {
    const profileData: Database['public']['Tables']['profiles']['Insert'] = {
      id: user.id,
      display_name: user.email?.split('@')[0] || 'User',
    };

    const { error } = await (supabase
      .from('profiles') as any)
      .insert(profileData);
    
    if (error) {
      console.error('Error creating profile:', error);
    }
  } catch (error) {
    console.error('Error creating profile:', error);
  }
};

// Ensure user profile exists (creates if it doesn't exist)
const ensureUserProfile = async (user: User) => {
  try {
    // Check if profile already exists
    const { data: existingProfile, error: selectError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (selectError && selectError.code === 'PGRST116') {
      // Profile doesn't exist, create it
      await createUserProfile(user);
    } else if (selectError) {
      console.error('Error checking profile:', selectError);
    }
  } catch (error) {
    console.error('Error ensuring profile:', error);
  }
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
      async (event, session) => {
        setAuth(session?.user ?? null, session);
        
        // Handle profile creation on sign-in or when user confirms email
        if (event === 'SIGNED_IN' && session?.user) {
          await ensureUserProfile(session.user);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setAuth(session?.user ?? null, session);
      
      // Ensure profile exists for existing session
      if (session?.user) {
        await ensureUserProfile(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [setAuth]);

  return { user, session, isLoading: false };
};