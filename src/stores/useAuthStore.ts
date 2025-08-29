import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  setAuth: (user: User | null, session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isLoading: true, // Start as loading until auth is initialized
  setAuth: (user, session) => set({ user, session, isLoading: false }),
  setLoading: (loading) => set({ isLoading: loading }),
  clearAuth: () => set({ user: null, session: null, isLoading: false }),
}));