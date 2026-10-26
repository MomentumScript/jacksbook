import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

// These two values are public by design (they ship inside the app).
// Security comes from the Row Level Security rules in the database.
export const SUPABASE_URL = 'https://dkqmgehhfoklitwfusjr.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_gCc1BPCZOxeS6oJTK-UeDQ_gDgDGA7y';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Keep the login fresh only while the app is open.
AppState.addEventListener('change', (state) => {
  if (state === 'active') supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});
