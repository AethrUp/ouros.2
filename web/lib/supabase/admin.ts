import { createClient } from '@supabase/supabase-js'

/**
 * Admin Supabase client with service role key
 *
 * IMPORTANT: This bypasses Row Level Security (RLS) policies.
 * Only use this for:
 * - Server-side operations that need elevated privileges
 * - Webhooks and background jobs
 * - Admin operations
 *
 * NEVER expose this client to the browser or client-side code.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
  }

  if (!supabaseServiceKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
