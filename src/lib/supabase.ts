import { createClient } from '@supabase/supabase-js';
import Config from 'react-native-config';
import { storage } from './storage';

// MMKV-backed storage adapter — synchronous, no AsyncStorage needed
const mmkvStorageAdapter = {
  getItem: (key: string): string | null => {
    return storage.getString(key) ?? null;
  },
  setItem: (key: string, value: string): void => {
    storage.set(key, value);
  },
  removeItem: (key: string): void => {
    storage.remove(key);
  },
};

const SUPABASE_URL = Config.SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = Config.SUPABASE_ANON_KEY ?? '';

console.log(`Supabase URL: ${SUPABASE_URL}, Anon Key: ${SUPABASE_ANON_KEY}`);

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: mmkvStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
