import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables. Admin features will not work.');
}

export const supabase = createClient(
  supabaseUrl || 'https://rwafjkkdflwfcuuhqepv.supabase.co',
  supabaseAnonKey || 'sb_publishable__jGBBI1KtA8NOtdR5kKXjw_CMth1tkg'
);
