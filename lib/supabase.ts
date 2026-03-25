import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './database.types';

// Lazy initialization of Supabase client
let supabaseClient: ReturnType<typeof createBrowserClient<Database>> | null = null;
let supabaseAdminClient: SupabaseClient<Database> | null = null;

export function getSupabase() {
  if (!supabaseClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Supabase URL or Anon Key is missing. Check your environment variables.');
      return null;
    }

    supabaseClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
  }
  return supabaseClient;
}

export function getSupabaseAdmin() {
  if (!supabaseAdminClient) {
    let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    let supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn('Supabase URL or Service Role Key is missing. Check your environment variables.');
      return null;
    }
    
    // Clean up keys in case they were pasted with prefixes
    supabaseUrl = supabaseUrl.replace(/^.*(https:\/\/)/i, '$1').trim();
    supabaseServiceKey = supabaseServiceKey.replace(/^.*(eyJhbG)/i, '$1').trim();
    
    supabaseAdminClient = createClient<Database>(supabaseUrl, supabaseServiceKey);
  }
  return supabaseAdminClient;
}
