import { createClient } from '@supabase/supabase-js'

// Connection comes from .env.local (never committed):
//   VITE_SUPABASE_URL=https://xxxx.supabase.co
//   VITE_SUPABASE_ANON_KEY=eyJ...
// When these are missing the app runs in in-memory mode — everything still
// works, nothing persists. See supabase/schema.sql for the tables.

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = url && anonKey ? createClient(url, anonKey) : null
export const supabaseEnabled = Boolean(supabase)

// Log-and-continue error handling: the UI already updated optimistically,
// so a failed sync should be visible in the console, not crash the shop.
export function logSupabaseError(where) {
  return ({ error }) => {
    if (error) console.warn(`Supabase ${where} failed:`, error.message)
  }
}
