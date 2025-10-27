import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If credentials are missing, return a mock client for build time
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials not found. Using mock client.');
    // Return a minimal mock that won't cause build errors
    return createBrowserClient(
      'https://placeholder.supabase.co',
      'placeholder-anon-key'
    );
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
