// Re-export the client-side Supabase client for compatibility
// with existing code that imports from utils/supabase
import { createClient } from '@/lib/supabase/client'

export const supabase = createClient()
