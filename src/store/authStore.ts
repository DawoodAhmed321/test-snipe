import { create } from 'zustand';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthState {
  session: Session | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;

  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>(set => ({
  session: null,
  loading: false,
  error: null,
  initialized: false,

  initialize: async () => {
    try {
      const { data } = await supabase.auth.getSession();
      set({ session: data.session, initialized: true });
    } catch {
      set({ initialized: true });
    }

    // Keep session in sync with Supabase auth state changes
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session });
    });
  },

  signIn: async (email, password) => {
    set({ loading: true, error: null });
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      set({ loading: false, error: error.message });
    } else {
      set({ loading: false, session: data.session, error: null });
    }
  },

  signOut: async () => {
    set({ loading: true });
    await supabase.auth.signOut();
    set({ session: null, loading: false });
  },

  clearError: () => set({ error: null }),
}));
