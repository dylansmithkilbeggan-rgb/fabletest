import { createClient } from '@supabase/supabase-js'

// The project URL and anon key are committed as defaults so the shop
// connects out of the box. The anon key is public by design — it ships in
// the site bundle for every visitor; row-level security in the database is
// what guards the data. (The service_role key is the secret one and must
// never appear here.) Set VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in
// .env.local to point somewhere else, e.g. a test project.

const DEFAULT_URL = 'https://lblwzpkoblcrytukzbmm.supabase.co'
const DEFAULT_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxibHd6cGtvYmxjcnl0dWt6Ym1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwOTYzMDcsImV4cCI6MjA5OTY3MjMwN30.ixVrNQ8RGbBFGabHLBIyxP_l3P-S0yFD_M1o7SMPvO0'

const url = import.meta.env.VITE_SUPABASE_URL || DEFAULT_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_ANON_KEY

export const supabase = url && anonKey ? createClient(url, anonKey) : null
export const supabaseEnabled = Boolean(supabase)

// Log-and-continue error handling: the UI already updated optimistically,
// so a failed sync should be visible in the console, not crash the shop.
// Handles both PostgREST errors (resolved with { error }) and network-level
// failures (rejected promise) — the latter would otherwise vanish silently.
export function syncToSupabase(builder, where) {
  Promise.resolve(builder)
    .then(({ error }) => {
      if (error) console.warn(`Supabase ${where} failed:`, error.message ?? error)
    })
    .catch((err) => {
      console.warn(`Supabase ${where} failed:`, err?.message ?? err)
    })
}
