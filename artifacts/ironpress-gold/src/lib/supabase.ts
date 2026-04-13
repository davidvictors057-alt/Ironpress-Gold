import { createClient } from '@supabase/supabase-js'
import { getEnv } from './env'

const supabaseUrl = getEnv('VITE_SUPABASE_URL')
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY')

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Check your .env file or Cloud Run secrets.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
