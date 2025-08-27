import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  setAuth: (user: User | null, session: Session | null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  setAuth: (user, session) => set({ user, session }),
  clearAuth: () => set({ user: null, session: null }),
}));